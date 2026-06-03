import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { categoryService } from "../services/category.service";
import { categoryController } from "../controllers/category.controller";

jest.mock("../services/category.service");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockCategoryService = categoryService as any;

const mockReq = (overrides = {}) => {
  return {
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request;
};

const mockRes = () => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe("categoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getCategories should fetch and respond", async () => {
    const req = mockReq();
    const res = mockRes();
    const data = [{ id: "c1" }];
    const meta = { total: 1, page: 1 };
    mockCategoryService.getAllCategories.mockResolvedValue({ data, meta });

    await (categoryController.getCategories as any)(req, res);
    expect(mockCategoryService.getAllCategories).toHaveBeenCalledWith(req.query);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Categories fetched successfully", data, meta);
  });

  it("createCategory should create and respond", async () => {
    const req = mockReq({ body: { name: "New" } });
    const res = mockRes();
    const created = { id: "c2", name: "New" };
    mockCategoryService.createCategory.mockResolvedValue(created);

    await (categoryController.createCategory as any)(req, res);
    expect(mockCategoryService.createCategory).toHaveBeenCalledWith(req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 201, "Category created successfully", created);
  });

  it("updateCategory should update and respond", async () => {
    const req = mockReq({ params: { id: "c1" }, body: { name: "Updated" } });
    const res = mockRes();
    const updated = { id: "c1", name: "Updated" };
    mockCategoryService.updateCategory.mockResolvedValue(updated);

    await (categoryController.updateCategory as any)(req, res);
    expect(mockCategoryService.updateCategory).toHaveBeenCalledWith("c1", req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Category updated successfully", updated);
  });

  it("deleteCategory should delete and respond", async () => {
    const req = mockReq({ params: { id: "c1" } });
    const res = mockRes();
    const result = { success: true };
    mockCategoryService.deleteCategory.mockResolvedValue(result);

    await (categoryController.deleteCategory as any)(req, res);
    expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith("c1");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Category deleted successfully", result);
  });
});
