import supertest from "supertest";
import app from "../app.mjs";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

beforeEach(cleanUpDatabase);
describe("POST /api/animals", function () {
  test("should create a new animal", async function () {
    const res = await supertest(app)
      .post("/api/animals")
      .send({
        species: "dog",
        race: "Labrador",
        name: "Buddy",
        age: 3,
        sex: "male",
        address: {
          city: "Lausanne",
          zip: "1004",
        },
        image: "https://example.com/images/buddy.jpg",
        price: 150,
        ownerId: "64a1b2c3d4e5f67890123456",
        availability: true,
        description:
          "Affectionate Labrador looking for a loving home. Good with children and other pets.",
        characteristics: {
          environment: ["appartement", "chien"],
          dressage: ["éduqué", "habitué à la laisse"],
          personality: ["affectueux", "joueur", "sociable"],
        },
      })
      .expect(201)
      .expect("Content-Type", /json/);

    // response shape: { message: "...", animal: { ... } }
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Animal created successfully");

    const created = res.body.animal;

    // Jest / jest-extended assertions matching the model & payload
    expect(created).toBeObject();
    expect(created._id).toBeString();
    expect(created.name).toEqual("Buddy");
    expect(created.species).toEqual("dog");
    expect(created.race).toEqual("Labrador");
    expect(created.age).toBeNumber();
    expect(created.age).toEqual(3);
    expect(created.sex).toBeOneOf(["male", "female"]);

    expect(created.address).toBeObject();
    expect(created.address).toContainAllKeys(["city", "zip"]);
    expect(created.address.city).toEqual("Lausanne");
    expect(created.address.zip).toEqual("1004");

    expect(created.image).toBeString();
    expect(created.price).toBeNumber();
    expect(created.price).toEqual(150);
    expect(created.ownerId).toBeString();
    expect(created.ownerId).toEqual("64a1b2c3d4e5f67890123456");
    expect(created.availability).toBeBoolean();
    expect(created.description).toBeString();

    expect(created.characteristics).toBeObject();
    expect(created.characteristics.environment).toBeArray();
    expect(created.characteristics.environment).toIncludeSameMembers([
      "appartement",
      "chien",
    ]);
    expect(created.characteristics.dressage).toBeArray();
    expect(created.characteristics.dressage).toIncludeSameMembers([
      "éduqué",
      "habitué à la laisse",
    ]);
    expect(created.characteristics.personality).toBeArray();
    expect(created.characteristics.personality).toIncludeSameMembers([
      "affectueux",
      "joueur",
      "sociable",
    ]);

    // include mongoose metadata 
    expect(created.createdAt).toBeString();
    expect(created.updatedAt).toBeString();
    expect(created.__v).toBeNumber();

    // basic keys present (including mongoose timestamps & version)
    expect(created).toContainAllKeys([
      "_id",
      "species",
      "race",
      "name",
      "age",
      "sex",
      "address",
      "image",
      "price",
      "ownerId",
      "availability",
      "description",
      "characteristics",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});

describe("GET /api/animals", function () {
  test.todo("should retrieve the list of animals");
});

afterAll(async () => {
  await mongoose.disconnect();
});
