import { Task, UnknownError } from "@ts-task/task";
import { Dictionary } from "../parmenides/dictionary.js";

export function traverseDictionary<T, E>(
  objOfTasks: Dictionary<Task<T, E>>,
): Task<Dictionary<T>, UnknownError | E> {
  // Create an array of task with a tuple containing the key and the value
  const tasks = Object.keys(objOfTasks).map((key) =>
    objOfTasks[key].map((value) => ({ key, value })),
  );
  // Wait until all tasks are resolved
  return (
    Task.all(tasks)
      // And transform the array back into an object
      .map((pairs) => {
        const ans: Dictionary<T> = {};
        pairs.forEach(({ key, value }) => (ans[key] = value));
        return ans;
      })
  );
}
