import express, { type Request, type Response } from "express";

const app = express();
const port = 8000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Hello, welcome to the classroom API!" });
});

app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Server started at ${url}`);
});
