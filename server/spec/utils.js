
import Animal from "../models/animal.js"
import Owner from "../models/owner.js";


export const cleanUpDatabase = async function() {
  await Promise.all([
    Animal.deleteMany(),
    Owner.deleteMany(),

  ]);
};