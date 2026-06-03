import { getQueryObject } from "../utils/query";

describe("getQueryObject utility", () => {
  test("converts string numbers to numbers and retains strings", () => {
    const query = {
      page: "2",
      limit: "10",
      skip: "5",
      search: "test",
      category: "cat",
      instructor: "inst",
      price: "free",
      sort: "title",
      order: "asc",
    };
    const result = getQueryObject(query);
    expect(result).toEqual({
      page: 2,
      limit: 10,
      skip: 5,
      search: "test",
      category: "cat",
      instructor: "inst",
      price: "free",
      sort: "title",
      order: "asc",
    });
  });

  test("returns empty object when no parameters", () => {
    const result = getQueryObject({});
    expect(result).toEqual({});
  });

  test("handles numeric inputs without conversion", () => {
    const query = {
      page: 3,
      limit: 20,
      skip: 0,
    } as any;
    const result = getQueryObject(query);
    expect(result).toEqual({ page: 3, limit: 20, skip: 0 });
  });
});
