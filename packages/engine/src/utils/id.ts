import { nanoid } from "nanoid";

const SIZE = 10;

export default function id(): string {
    return nanoid(SIZE);
}