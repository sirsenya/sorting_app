import { PathLike, WriteStream, createReadStream, createWriteStream } from "fs";
import { Interface, createInterface } from "readline";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import {
  BUFFER_SIZE,
  PATH_TO_RESULT_FILE,
  PATH_TO_TEMP_FOLDER,
} from "../main.js";
import { pipeline } from "stream/promises";

export const createResultFile = async () => {
  const tempFolderPath: PathLike = PATH_TO_TEMP_FOLDER;
  console.log(tempFolderPath);
  const sortedFilePath: PathLike = PATH_TO_RESULT_FILE;
  const fileNames: string[] = await readdir(tempFolderPath);
  const streams: AsyncIterableIterator<string>[] = fileNames.map((fileName) => {
    const rl: Interface = createInterface({
      input: createReadStream(join(tempFolderPath.toString(), fileName), {
        highWaterMark: BUFFER_SIZE,
      }),
      crlfDelay: Infinity,
    });
    return rl[Symbol.asyncIterator]();
  });

  const ws: WriteStream = createWriteStream(sortedFilePath, {
    highWaterMark: BUFFER_SIZE,
  });
  const heap: string[] = await Promise.all(
    streams.map((stream) => stream.next().then((e) => e.value))
  );
  const generator = async function* () {
    while (heap.length > 0) {
      const winner: string = [...heap].sort()[0];
      const winnerIndex: number = heap.indexOf(winner);
      yield winner + "\n";
      console.log(winner);
      let next: IteratorResult<string, any> = await streams[winnerIndex].next();
      next.done
        ? (heap.splice(winnerIndex, 1), streams.splice(winnerIndex, 1))
        : (heap[winnerIndex] = next.value);
    }
  };
  await pipeline(generator, ws).then(() =>
    rm(PATH_TO_TEMP_FOLDER, { force: true, recursive: true })
  );
};
