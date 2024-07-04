import { MenuTypeEnum } from "./menu";

export interface IItem {
  number?: number;
  status?: string;
  name?: string;
  comment?: string;
  count?: number;
  type?: MenuTypeEnum;
  sound?: boolean;
}
