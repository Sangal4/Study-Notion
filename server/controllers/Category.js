const { Mongoose } = require("mongoose");
const Category = require("../models/Category");

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        // Create a new category
        const categoryDetails = await Category.create({
            name,
            description,
        });

        console.log(categoryDetails);
        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: categoryDetails,
        });
    } catch (error) {
        console.error("Error creating category:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message,
        });
    }
};

// Show all categories
exports.showAllCategories = async (req, res) => {
    try {
        console.log("INSIDE SHOW ALL CATEGORIES");

        // Retrieve all categories
        const allCategories = await Category.find({});
        return res.status(200).json({
            success: true,
            data: allCategories,
        });
    } catch (error) {
        console.error("Error retrieving categories:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve categories",
            error: error.message,
        });
    }
};

// Category page details
exports.categoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body;

        console.log("PRINTING CATEGORY ID:", categoryId);

        // Validate categoryId
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            });
        }

        // Fetch the selected category and its published courses
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })
            .exec();

        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category",
            });
        }

        // Fetch other categories excluding the selected one
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        });

        let differentCategory = null;
        if (categoriesExceptSelected.length > 0) {
            const randomIndex = getRandomInt(categoriesExceptSelected.length);
            differentCategory = await Category.findById(
                categoriesExceptSelected[randomIndex]._id
            )
                .populate({
                    path: "courses",
                    match: { status: "Published" },
                })
                .exec();
        }

        // Fetch top-selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "instructor",
                },
            })
            .exec();

        const allCourses = allCategories.flatMap((category) => category.courses);
        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10);

        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        });
    } catch (error) {
        console.error("Error in categoryPageDetails:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
