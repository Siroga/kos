import { MenuTypeEnum } from "./menu";

export interface IItem {
  id?: number;
  number?: number;
  status?: string;
  name?: string;
  comment?: string;
  count?: number;
  type?: MenuTypeEnum;
  sound?: boolean;
}

export interface IItemsList {
  items: IItem[];
  lastIndex: number;
}
