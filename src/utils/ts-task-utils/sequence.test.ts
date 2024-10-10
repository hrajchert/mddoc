import { jest } from "@jest/globals";
import { Task } from "@ts-task/task";
import { FunctionLike } from "jest-mock";

import { assertFork, jestAssertNever } from "../testing-utils.js";
import { FixAnyTypeScriptVersion } from "../typescript.js";

import { sequence } from "./sequence.js";

const asStep = <T extends FunctionLike>(mock: jest.Mock<T>) => mock as () => T;

describe("ts-task-utils", () => {
  describe("sequence", () => {
    const task1Mock = jest.fn((x: number) => Task.resolve(1 + x));
    const task1 = asStep(task1Mock) as FixAnyTypeScriptVersion;

    const task2Mock = jest.fn((x: number) => Task.resolve(1 + x));
    const task2 = asStep(task2Mock);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("it should call one task", (done) => {
      const seq = sequence([task1]);
      seq.fork(
        jestAssertNever(done),
        assertFork(done, (_) => expect(task1Mock.mock.calls.length).toBe(1)),
      );
    });

    test("it should call two task, one after the other", (done) => {
      const seq = sequence([task1, task2]);
      seq.fork(
        jestAssertNever(done),
        assertFork(done, (_) => {
          expect(task1Mock.mock.calls.length).toBe(1);
          expect(task2Mock.mock.calls.length).toBe(1);
        }),
      );
    });
  });
});
