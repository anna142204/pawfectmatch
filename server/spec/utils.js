
import Animal from "../models/animal.js"
import Owner from "../models/owner.js";
import Adopter from "../models/adopter.js";
import Match from "../models/match.js";

export const cleanUpDatabase = async function() {
  await Promise.all([
    Animal.deleteMany(),
    Owner.deleteMany(),
    Adopter.deleteMany(),
    Match.deleteMany()


  ]);
};