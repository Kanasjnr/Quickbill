import React, { useEffect, useState } from "react";
import { addDays, format, set } from "date-fns";
import ReactSelect from "react-select";

import {
	Box,
	Flex,
	Text,
	Table,
	Tbody,
	Thead,
	Tr,
	Td,
	Button,
	MenuButton,
	MenuItem,
	MenuList,
	Menu,
	Divider,
	Input,
	Select,
	Textarea,
	Th,
	MenuDivider,
	Icon,
} from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon } from "@chakra-ui/icons";
import { useRecoilState, useSetRecoilState } from "recoil";
import invoiceAtom from "../atoms/invoiceAtom";
import userAtom from "../atoms/userAtom";
import { axiosInstance } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import AddClientModal from "./AddClientModal";
import addClientModalOpenAtom from "../atoms/addClientModalOpenAtom";
import allClientsAtom from "../atoms/allClientsAtom";
import { MdOutlineCancel } from "react-icons/md";
import currencies from "../utils/currencies.json";

const todayDate = new Date();
const rawDueDate = addDays(todayDate, 7);

const currencyOptions = currencies;

const options = [
	{ value: "chocolate", label: "Chocolate" },
	{ value: "strawberry", label: "Strawberry" },
	{ value: "vanilla", label: "Vanilla" },
];

function Invoice() {
	const [invoice, setInvoice] = useRecoilState(invoiceAtom);
	const [invoiceItems, setInvoiceItems] = useState([]);
	const [user, setUser] = useRecoilState(userAtom);
	const [clients, setClients] = useRecoilState(allClientsAtom);
	const [currentInvoiceNumber, setcurrentInvoiceNumber] = useState("");
	const [clientsSelectOptions, setClientsSelectOptions] = useState("");
	const [selectedOption, setSelectedOption] = useState(null);
	const [selectedClientDetails, setSelectedClientDetails] = useState(null);
	const [isSelectedClient, setIsSelectedClient] = useState(false);
	const [selectedDueDate, setSelectedDueDate] = useState(rawDueDate);
	const [selectedCurrency, setSelectedCurrency] = useState('USD');
	const [tableData, setTableData] = useState([
		{
			itemName: "",
			qty: "",
			price: "",
			disc: "",
			amtAfterDiscount: (0.0).toFixed(2),
			discValue: "",
			amtBeforeDiscount: "",
		},
	]);
	const [totalDiscount, setTotalDiscount] = useState(0);
	const [vatRate, setVatRate] = useState("");
	const [vatAmt, setVatAmt] = useState(0);
	const [subTotal, setSubTotal] = useState(0);
	const [totalAmtAfterDiscount, setTotalAmtAfterDiscount] = useState(0);
	const [grandTotal, setGrandTotal] = useState(0);
	const setAddClientModalOpen = useSetRecoilState(addClientModalOpenAtom);
	// const [inviteModalOpen, setInviteModalOpen] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		const getInvoiceNo = async () => {
			try {
				const response = await axiosInstance.get("/invoices");
				const data = response.data;
				// console.log(data);
				const totalInvoices = data.length;
				const newInvNo = totalInvoices + 1;
				const formattedInvoiceNumber = newInvNo.toString().padStart(3, "0");
				setcurrentInvoiceNumber(formattedInvoiceNumber);
				setInvoice({ ...invoice, invoiceNumber: formattedInvoiceNumber });
			} catch (error) {
				console.log(error.response);
				const errorData = error.response.data;
				if (errorData.error.startsWith("Internal")) {
					console.log("Internal Server Error");
				} else if (errorData.error.startsWith("jwt" || "Unauthorized")) {
					navigate("/auth");
				}
			}
		};

		getInvoiceNo();
	}, []);

	useEffect(() => {
		const setOptions = () => {
			const options = clients.map((client) => {
				return { value: client._id, label: client.name };
			});

			setClientsSelectOptions(options);
		};
		setOptions();
	}, [clients]);

	useEffect(() => {
		const getAllClients = async () => {
			try {
				const response = await axiosInstance.get("/clients");
				const data = response.data;
				// setInvoiceItems(data);
				setClients(data);
				localStorage.setItem("clients-quickBill", JSON.stringify(data));
				console.log(data);
			} catch (error) {
				console.log(error);
				if (error.response.status === 401) {
					navigate("/auth");
				}
			}
		};
		getAllClients();
	}, []);

	const addRow = () => {
		const newRow = {
			itemName: "",
			qty: "",
			price: "",
			disc: "",
			amtAfterDiscount: (0.0).toFixed(2),
			discValue: "",
			amtBeforeDiscount: "",
		};
		setTableData((prevData) => [...prevData, newRow]);
	};

	const deleteRow = (index) => {
		const updatedData = [...tableData];
		updatedData.splice(index, 1);
		setTableData(updatedData);
	};

	const handleItemsInputChange = (index, columnName, value) => {
		// const updatedData = [...tableData];
		// updatedData[index][columnName] = value;
		// setTableData(updatedData);
		setTableData((prevTableDate) => {
			const updatedData = [...prevTableDate];
			updatedData[index] = {
				...updatedData[index],
				[columnName]: value,
			};

			//Perform calculations and update total for the specific row
			const valBeforeDiscount =
				Number(updatedData[index].qty) * Number(updatedData[index].price);
			const discount = Number(updatedData[index].disc) / 100;
			const valAfterDiscount = valBeforeDiscount * (1 - discount);
			const discountValue = valBeforeDiscount - valAfterDiscount;
			updatedData[index].amtAfterDiscount = valAfterDiscount.toFixed(2);
			updatedData[index].amtBeforeDiscount = valBeforeDiscount;
			updatedData[index].discValue = discountValue;
			return updatedData;
		});
	};

	const handleDueDateChange = (e) => {
		setSelectedDueDate(new Date(e.target.value));
	};

	const handleSelectedClient = async (selectedOptionValue) => {
		const clientId = selectedOptionValue.value;

		const selectedclient = clients.find((client) => {
			return client._id === clientId;
		});

		setSelectedClientDetails(selectedclient);
		setIsSelectedClient(true);
	};

	// const handleSelectedCurrency = (selectedOptionValue) => {
	// 	const currency = selectedOptionValue.value;
	// }

	useEffect(() => {
		console.log(selectedCurrency);
	}, [selectedCurrency]);

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	useEffect(() => {
		//Calculate Total Value before Discount
		const totalBeforeDiscount = tableData.reduce(
			(acc, row) => acc + Number(row.amtBeforeDiscount),
			0
		);
		setSubTotal(totalBeforeDiscount.toFixed(2));

		// Calculate Subtotal based on table data
		const totalAfterDiscount = tableData.reduce(
			(acc, row) => acc + Number(row.amtAfterDiscount),
			0
		);
		setTotalAmtAfterDiscount(totalAfterDiscount.toFixed(2));

		// Calculate Grand Total after removing VAT
		const vatAmount = (totalAfterDiscount * Number(vatRate)) / 100;
		setVatAmt(vatAmount.toFixed(2));

		const calculatedDiscountValue = tableData.reduce(
			(acc, row) => acc + Number(row.discValue),
			0
		);
		setTotalDiscount(calculatedDiscountValue.toFixed(2));

		const calculatedGrandTotal = totalAfterDiscount + vatAmount;
		setGrandTotal(calculatedGrandTotal.toFixed(2));

		setInvoice({ ...invoice, items: tableData });
	}, [tableData, vatRate]);

	return (
		<>
			<Box
				m={10}
				py={10}
				border={"1px solid black"}
				bg={"#fff"}
				borderRadius={10}
			>
				<Box textAlign={"right"} px={10}>
					<Text fontSize={"36px"} fontWeight={700}>
						INVOICE{" "}
					</Text>
					<Text fontWeight={400} fontSize={"26px"}>
						Invoice #: {currentInvoiceNumber}
					</Text>
				</Box>
				<Box borderBottom="1px" borderColor="gray" w={"full"}></Box>

				<Flex justifyContent={"space-between"} pt={"27"} pb={"2"} px={10}>
					<Box>
						<Text as={"h2"} fontSize={"xl"} fontWeight={600}>
							Bill To
						</Text>
						{!isSelectedClient ? (
							<Flex gap={2} flexDir={"column"}>
								<Box w={250}>
									<ReactSelect
										onChange={handleSelectedClient}
										options={clientsSelectOptions}
										placeholder="Select Client"
									/>
								</Box>
								<Button
									bg={"#2970FF"}
									color={"#F6F6F6"}
									w={150}
									onClick={() => setAddClientModalOpen(true)}
								>
									Add New Client
								</Button>
							</Flex>
						) : (
							<Flex gap={4}>
								<Box>
									<Text>{selectedClientDetails?.name}</Text>
									<Text>{selectedClientDetails?.email}</Text>
									<Text>{selectedClientDetails?.address}</Text>
								</Box>
								<Icon
									as={MdOutlineCancel}
									fontSize={"2xl"}
									cursor={"pointer"}
									color={"red"}
									onClick={() => setIsSelectedClient(false)}
								/>
							</Flex>
						)}
					</Box>

					{/* <Box>
						<Text as={"h2"} fontSize={"xl"} fontWeight={600}>
							Bill To
						</Text>
						
					</Box> */}

					<AddClientModal />

					<Box>
						<Text as={"h2"} fontWeight={500} fontSize={"18"}>
							STATUS
						</Text>
						<Text
							as={"h2"}
							fontWeight={400}
							color={"red"}
							pb={"5"}
							fontSize={"20"}
						>
							Unpaid
						</Text>

						<Text fontWeight={500} fontSize={"18"}>
							DATE:
						</Text>
						<Text pb={"25"}>{format(todayDate, "PP")} </Text>

						<Text fontWeight={500}>DUE DATE:</Text>
						<Text pb={"35"}>{format(selectedDueDate, "PP")}</Text>
						<Text fontSize={"22"} fontWeight={500}>
							AMOUNT
						</Text>
						<Text fontSize={"20"}>{selectedCurrency} {grandTotal}</Text>
					</Box>
				</Flex>
				{/* <Flex justifyContent={"space-between"} alignItems={"center"}></Flex> */}

				<form onSubmit={handleSubmit}>
					<Box mt={8}>
						<Table variant="striped" colorScheme="gray.600">
							<Thead>
								<Tr bg={"#F4F4F4"}>
									<Th w={300}>Item</Th>

									<Th>Qty</Th>
									<Th>Unit Price</Th>
									<Th>Discount(%)</Th>
									<Th>Amount</Th>
									<Th>Action</Th>
								</Tr>
							</Thead>
							<Tbody>
								{tableData.map((row, index) => (
									<Tr key={index}>
										<Td>
											<Input
												placeholder="Item name or description"
												type="text"
												required
												value={row.itemName}
												onChange={(e) =>
													handleItemsInputChange(
														index,
														"itemName",
														e.target.value
													)
												}
											/>
										</Td>
										<Td>
											<Input
												placeholder="0"
												required
												type="number"
												value={row.qty}
												onChange={(e) =>
													handleItemsInputChange(index, "qty", e.target.value)
												}
											/>
										</Td>
										<Td>
											<Input
												placeholder="0"
												required
												type="number"
												value={row.price}
												onChange={(e) =>
													handleItemsInputChange(index, "price", e.target.value)
												}
											/>
										</Td>
										<Td>
											<Input
												placeholder="0"
												type="number"
												value={row.disc}
												onChange={(e) =>
													handleItemsInputChange(index, "disc", e.target.value)
												}
											/>
										</Td>
										<Td>
											<Text>{row.amtAfterDiscount}</Text>
										</Td>
										<Td>
											<DeleteIcon
												cursor={"pointer"}
												onClick={() => deleteRow(index)}
											/>
										</Td>
									</Tr>
								))}
							</Tbody>
						</Table>
					</Box>

					<Button
						onClick={addRow}
						ml={10}
						mt={5}
						bg={"#2970FF"}
						borderRadius="50%"
						color={"#fff"}
					>
						+
					</Button>

					<Flex mt={100} justifyContent={"flex-end"}>
						<Table
							variant="striped"
							fontSize={"20px"}
							fontWeight={500}
							color={"gray"}
							w={"45%"}
						>
							<Thead pl={2}>
								<Tr bg="#F4F4F4">
									<Td>Invoice Summary </Td>
									<Td> </Td>
								</Tr>

								<Tr>
									<Td color={"gray"}>Sub Total: </Td>
									<Td color={"gray"}>{subTotal}</Td>
								</Tr>
								<Tr>
									<Td color={"gray"}>Discount ({selectedCurrency}): </Td>
									<Td color={"gray"}>{totalDiscount}</Td>
								</Tr>
								<Tr>
									<Td color={"gray"}>Total after Discount ({selectedCurrency}): </Td>
									<Td color={"gray"}>{totalAmtAfterDiscount}</Td>
								</Tr>

								<Tr>
									<Td color={"gray"}>VAT ({selectedCurrency}): </Td>
									<Td color={"gray"}>{vatAmt}</Td>
								</Tr>
								<Tr>
									<Td color={"gray"}>Total: </Td>
									<Td color={"gray"}>{grandTotal}</Td>
								</Tr>
							</Thead>
						</Table>
					</Flex>

					<Flex
						p={4}
						justifyContent={"space-between"}
						alignItems={"center"}
						px={10}
						mt={10}
					>
						<Flex flexDir={"column"} gap={2}>
							<Text color={"gray"}>Tax Rate (%) </Text>
							<Input
								placeholder="0"
								size="md"
								type="number"
								value={vatRate}
								onChange={(e) => setVatRate(e.target.value)}
							/>
						</Flex>

						<Flex flexDir={"column"} gap={2}>
							<Text color={"gray"}>Due Date</Text>

							<Input
								placeholder="Select Date and Time"
								size="md"
								type="date"
								value={format(selectedDueDate, "yyyy-MM-dd")}
								onChange={handleDueDateChange}
								min={format(addDays(todayDate, 1), "yyyy-MM-dd")}
							/>
						</Flex>
						<Flex flexDir={"column"} gap={2}>
							<Text color={"gray"}>Currency</Text>
				
							<ReactSelect
								defaultValue={{ label: "US Dollar", value: "USD" }}
								options={currencyOptions}
								placeholder={"Select Currency"}
								onChange={(currencyInfo) => setSelectedCurrency(currencyInfo.value)}
							/>
						</Flex>
					</Flex>
					<Flex pb={"30px"} flexDir={"column"} px={10} pt={"17px"}>
						<Text>Note/Additional Information</Text>
						<Box>
							<Textarea placeholder="Kindly provide additional details or terms of service " />
						</Box>
					</Flex>

					<Box mt={8}>
						<Flex justifyContent="center" pb={5}>
							<Button type="submit" bg={"#2970FF"}>
								Create and send
							</Button>
						</Flex>
					</Box>
				</form>
			</Box>
		</>
	);
}

export default Invoice;
