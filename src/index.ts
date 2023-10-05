import { SanityClient } from "@sanity/client";

import {
    DataProvider,
  } from "@refinedev/core";

  import { q } from 'groqd';
import { generateFilter } from "./utils/generateFilter";
import { generateSelect } from "./utils/generateSelect";
  
// @ts-ignore   
class SanityDataProvider<T> implements DataProvider<T> {
    constructor(private client: SanityClient) {
    }
    async getList({ resource, pagination, sorters, filters, meta }: Parameters<DataProvider['getList']>[0]) {
        const {
            current = 1,
            pageSize = 10,
          } = pagination ?? {};
          const start = (current - 1) * pageSize;
          const end = start + pageSize - 1;
        const dataQuery = q("*").filterByType(resource);
        const filterStr = generateFilter(filters);
        if(filterStr) {
          dataQuery.filter(filterStr); // Apply filters if any result's achieved
        }

        const totalQuery = dataQuery.query; // Separate query to avoid sliced total
        dataQuery.slice(start, end);
        const paginatedQuery = q(`{
          "data": ${dataQuery.query}${generateSelect(meta?.fields)},
          "total": count(${totalQuery}._id)
        }`);
        const response = await this.client.fetch(paginatedQuery.query);
        return {
          data: response.data,
          total: response.total
        };
    }


}

export default SanityDataProvider;