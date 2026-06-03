// query utils

export interface IQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  category?: string;
  skip?: number | string;
  instructor?: string;
  price?: string;
  sort?: string;
  order?: string;
}

export const getQueryObject = (query: IQuery) => {
  const { page, limit, search, category, instructor, price, sort, order, skip } = query;
  const queryObject: Partial<IQuery> = {};

  if (page !== undefined) queryObject.page = Number(page);
  if (limit !== undefined) queryObject.limit = Number(limit);
  if (skip !== undefined) queryObject.skip = Number(skip);
  if (search !== undefined) queryObject.search = search;
  if (category !== undefined) queryObject.category = category;
  if (instructor !== undefined) queryObject.instructor = instructor;
  if (price !== undefined) queryObject.price = price;
  if (sort !== undefined) queryObject.sort = sort;
  if (order !== undefined) queryObject.order = order;

  return queryObject;
};