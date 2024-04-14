import { PathLike, ReadStream, createReadStream, mkdir } from "fs";
import { join } from "path";
import { Interface, createInterface } from "node:readline";
import { createSortedChunkFile } from "./src/create_sorted_chunk_file.js";
import { config } from "dotenv";
import { createResultFile } from "./src/create_result_file.js";

config();
export const BUFFER_SIZE: number = parseInt(process.env.BUFFER_SIZE!);
export const PATH_TO_TEMP_FOLDER: PathLike = join(process.cwd(), "temp");
const CHUNK_FILE_SIZE: number = parseInt(process.env.CHUNK_FILE_SIZE!);
const PATH_TO_INITIAL_FILE: PathLike = process.env.PATH_TO_INITIAL_FILE!;
export const PATH_TO_RESULT_FILE: PathLike = process.env.PATH_TO_RESULT_FILE!;

const startSorting = async () => {
  console.log(BUFFER_SIZE);
  try {
    const readStream: ReadStream = createReadStream(PATH_TO_INITIAL_FILE, {
      highWaterMark: BUFFER_SIZE,
    });

    let lines: string[] = [];
    let prefix = 0;
    let memory = 0;

    const readline: Interface = createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    for await (const rl of readline) {
      memory += rl.length;
      lines.push(rl + "\n");
      if (memory >= CHUNK_FILE_SIZE) {
        prefix++;
        await createSortedChunkFile({ lines, prefix });
        memory = 0;
        lines = [];
      }
    }
    if (lines.length > 0) {
      prefix++;
      await createSortedChunkFile({ lines, prefix });
    }
    await createResultFile();
  } catch (e) {
    console.error(e);
  }
};
mkdir(PATH_TO_TEMP_FOLDER, () => {});
startSorting();
