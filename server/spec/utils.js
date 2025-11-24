
import Animal from "../models/animal.js"

export const cleanUpDatabase = async function() {
  await Promise.all([
    Animal.deleteMany()
  ]);
};