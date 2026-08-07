"use client";

/**
 * ui/table —— 数据表格（kumo 标准）
 *
 * @example
 * <Table.Root>
  <Table.Header><Table.Row><Table.Head>列</Table.Head></Table.Row></Table.Header>
  <Table.Body><Table.Row><Table.Cell>值</Table.Cell></Table.Row></Table.Body>
</Table.Root>
 */
import { Table as KumoTable } from "@cloudflare/kumo/components/table";

export const Table = KumoTable;
export default Table;
