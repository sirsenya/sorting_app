import { createWriteStream } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { createResultFile } from "./create_result_file.js";
import { BUFFER_SIZE } from "../main.js";

export const createSortedChunkFile = async (params: {
  lines: string[];
  prefix: number;
}) => {
  const { lines, prefix } = params;
  console.log("creating chunk file");
  lines.sort();
  const pathToChunkedFile = join(process.cwd(), "temp", prefix + "temp.txt");
  const ws = createWriteStream(pathToChunkedFile, {
    highWaterMark: BUFFER_SIZE,
  });
  await pipeline(lines, ws);
};
