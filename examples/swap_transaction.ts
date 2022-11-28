import dotenv from "dotenv";
import SDK from '@pontem/liquidswap-sdk';
import { NODE_URL } from "./common";

dotenv.config();

(async() => {
  const sdk = new SDK({
    nodeUrl: NODE_URL,
  });

  // TODO: 
})();
