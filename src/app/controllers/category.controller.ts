//  ====================
//    Category Controller
// ====================

import { Request,  Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { categoryService } from "../services/category.service";
import { sendResponse } from "../utils/sendResponse";


export const categoryController = {
  // ============================== GET ALL Categories ==============================
  getCategories: catchAsyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories(req.query);
    sendResponse(res, 200, "Categories fetched successfully", categories);
  }),

  // ============================== CREATE Category ==============================
  createCategory: catchAsyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    sendResponse(res, 201, "Category created successfully", category);
  }),

  // ============================== UPDATE Category ==============================
  updateCategory: catchAsyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(req.params.id as string, req.body);
    sendResponse(res, 200, "Category updated successfully", category);
  }),

  // ============================== DELETE Category ==============================
  deleteCategory: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await categoryService.deleteCategory(req.params.id as string);
    sendResponse(res, 200, "Category deleted successfully", result);
  })
}


