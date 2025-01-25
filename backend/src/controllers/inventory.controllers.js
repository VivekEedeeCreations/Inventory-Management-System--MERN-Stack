import Inventory from "../models/Inventory.models.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import Sale from "../models/Sale.models.js";

const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.status(200).json(inventory);
  } catch (error) {
    res.status(400).json({ message: "Error fetching inventory", error });
  }
};

const addInventory = [
  upload.single("image"),
  async (req, res) => {
    const {
      name,
      productId,
      category,
      buyingPrice,
      quantity,
      unit,
      expiryDate,
      threshold,
      price,
    } = req.body;
    const localFilePath = req.file?.path;

    if (!localFilePath) {
      console.error("Error: Image file is required");
      return res.status(400).json({ message: "Image file is required" });
    }

    try {
      const result = await uploadOnCloudinary(localFilePath);
      console.log("Cloudinary upload result:", result);
      const imageUrl = result?.url || "";

      const newInventory = new Inventory({
        image: imageUrl,
        name,
        productId,
        category,
        buyingPrice,
        quantity,
        unit,
        expiryDate,
        threshold,
        price,
      });

      await newInventory.save();
      res
        .status(201)
        .json({ message: "Inventory added successfully", newInventory });
    } catch (error) {
      console.error("Error adding inventory:", error); // Log the error for debugging
      res.status(500).json({ message: "Error adding inventory", error });
    }
  },
];

const updateInventory = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    productId,
    category,
    buyingPrice,
    quantity,
    unit,
    expiryDate,
    threshold,
    price,
  } = req.body;

  try {
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      {
        name,
        productId,
        category,
        buyingPrice,
        quantity,
        unit,
        expiryDate,
        threshold,
        price,
      },
      { new: true }
    );

    if (!updatedInventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(400).json({ message: "Error updating inventory", error });
  }
};

const deleteInventory = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedInventory = await Inventory.findByIdAndDelete(id);

    if (!deletedInventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting inventory", error });
  }
};

const getChartData = async (req, res) => {
  try {
    const inventory = await Inventory.find();
    const sales = await Sale.find();

    const salesData = sales.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleString("default", {
        month: "short",
      });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += sale.quantitySold * sale.salePrice;
      return acc;
    }, {});

    const formattedSalesData = Object.keys(salesData).map((month) => ({
      month,
      totalSales: salesData[month],
    }));

    const inventoryLevels = inventory.map((item) => ({
      name: item.name,
      quantity: item.quantity,
    }));

    res.status(200).json({
      salesData: formattedSalesData,
      inventoryLevels,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching chart data", error });
  }
};

export {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  getChartData,
};
