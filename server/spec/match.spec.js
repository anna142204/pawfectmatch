import supertest from "supertest";
import app from "../app.mjs";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

// reusable payloads
const adopterPayload = {
  firstName: "Marie",
  lastName: "Martin",
  email: "marie.martin11@example.com",
  password: "securePassword123",
  address: {
    zip: "1201",
    city: "Genève",
  },
  age: 28,
  about: "Passionné par les animaux, je cherche un compagnon fidèle pour partager ma vie.",
  preferences: {
    environment: ["appartement", "enfant"],
    species: ["chat", "chien"],
    sizePreference: ["petit", "moyen"],
  },
  image: "https://i.pravatar.cc/150?u=john.doe@example.com"
};

const ownerPayload = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  password: "securePassword123",
  address: {
    zip: "1000",
    city: "Lausanne",
  },
  phoneNumber: "+41 79 123 45 67",
  about: "Passionné par les animaux, je cherche une famille aimante pour mon compagnon fidèle.",
  image: "https://i.pravatar.cc/150?u=john.doe@example.com"
};

const animalPayload = {
  species: "chien",
  race: "Labrador",
  name: "Buddy",
  age: "1-3",
  sex: "male",
  size: "grand",
  weight: "20-30",
  address: {
    city: "Lausanne",
    zip: "1004",
  },
  image: "https://example.com/images/buddy.jpg",
  price: 150,
  availability: true,
  description: "Affectionate Labrador looking for a loving home.",
  characteristics: {
    environment: ["appartement", "chien"],
    dressage: ["éduqué", "habitué à la laisse"],
    personality: ["affectueux", "joueur", "sociable"],
  },
};

beforeEach(async () => await cleanUpDatabase());
describe("POST /api/matches", function () {
  test("should create a new match between adopter and animal", async function () {
    // 1. Register owner
    const ownerRes = await supertest(app)
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = ownerRes.body.user._id;

    // 2. Register adopter
    const adopterRes = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const adopterId = adopterRes.body.user._id;
    const adopterToken = adopterRes.body.token;

    // 3. Create animal with ownerId
    const animalPayloadWithOwner = {
      ...animalPayload,
      ownerId,
    };

    const animalRes = await supertest(app)
      .post("/api/animals")
      .send(animalPayloadWithOwner)
      .expect(201);

    const animalId = animalRes.body.animal._id;

    // 4. Create match (controller accepts ONLY adopterId, animalId)
    const matchPayload = {
      adopterId,
      animalId,
    };

    const res = await supertest(app)
      .post("/api/matches")
      .set("Authorization", `Bearer ${adopterToken}`)
      .send(matchPayload)
      .expect(201)
      .expect("Content-Type", /json/);

    // Assertions
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Match created successfully");

    const match = res.body.match;
    expect(match).toBeObject();
    expect(match._id).toBeString();

    // adopterId should be populated with adopter details
    expect(match.adopterId).toBeObject();
    expect(match.adopterId._id).toEqual(adopterId);
    expect(match.adopterId.firstName).toEqual(adopterPayload.firstName);
    expect(match.adopterId.lastName).toEqual(adopterPayload.lastName);
    expect(match.adopterId.email).toEqual(adopterPayload.email);

    // animalId should be populated with animal details
    expect(match.animalId).toBeObject();
    expect(match.animalId._id).toEqual(animalId);
    expect(match.animalId.species).toEqual(animalPayload.species);
    expect(match.animalId.name).toEqual(animalPayload.name);
    expect(match.animalId.address.city).toEqual(animalPayload.address.city);
    expect(match.animalId.address.zip).toEqual(animalPayload.address.zip);


    // ownerId of animal should also be populated
    expect(match.animalId.ownerId).toBeObject();
    expect(match.animalId.ownerId._id).toEqual(ownerId);
    expect(match.animalId.ownerId.firstName).toEqual(ownerPayload.firstName);

    // match fields
    expect(match.isActive).toBeBoolean();
    expect(match.isActive).toEqual(true);

    // discussion array should be EMPTY initially
    expect(match.discussion).toBeArray();
    expect(match.discussion.length).toEqual(0);

    // mongoose metadata
    expect(match.createdAt).toBeString();
    expect(match.updatedAt).toBeString();
    expect(match.__v).toBeNumber();

    // keys present
    expect(match).toContainAllKeys([
      "_id",
      "adopterId",
      "animalId",
      "isActive",
      "discussion",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});

describe("GET /api/matches", function () {
  test("should retrieve the list of matches", async function () {
    // 1. Register owner
    const ownerRes = await supertest(app)
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = ownerRes.body.user._id;

    // 2. Register adopter
    const adopterRes = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const adopterId = adopterRes.body.user._id;
    const adopterToken = adopterRes.body.token;

    // 3. Create animal with ownerId
    const animalPayloadWithOwner = {
      ...animalPayload,
      ownerId,
    };

    const animalRes = await supertest(app)
      .post("/api/animals")
      .send(animalPayloadWithOwner)
      .expect(201);

    const animalId = animalRes.body.animal._id;

    // 4. Create match
    const matchPayload = {
      adopterId,
      animalId,
    };

    await supertest(app)
      .post("/api/matches")
      .set("Authorization", `Bearer ${adopterToken}`)
      .send(matchPayload)
      .expect(201);

    // 5. GET matches
    const res = await supertest(app)
      .get("/api/matches")
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(res.body).toBeObject();
    expect(res.body.matches).toBeArray();
    expect(res.body.pagination).toBeObject();

    // pagination checks
    expect(res.body.pagination.total).toBeNumber();
    expect(res.body.pagination.page).toBeNumber();
    expect(res.body.pagination.limit).toBeNumber();
    expect(res.body.pagination.pages).toBeNumber();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);

    // first match should match created data
    const first = res.body.matches[0];
    expect(first).toBeObject();
    expect(first._id).toBeString();

    // adopterId populated
    expect(first.adopterId).toBeObject();
    expect(first.adopterId._id).toEqual(adopterId);
    expect(first.adopterId.firstName).toEqual(adopterPayload.firstName);
    expect(first.adopterId.lastName).toEqual(adopterPayload.lastName);
    expect(first.adopterId.email).toEqual(adopterPayload.email);

    // animalId populated
    expect(first.animalId).toBeObject();
    expect(first.animalId._id).toEqual(animalId);
    expect(first.animalId.species).toEqual(animalPayload.species);
    expect(first.animalId.race).toEqual(animalPayload.race);
    expect(first.animalId.name).toEqual(animalPayload.name);
    expect(first.animalId.age).toBeString();
    expect(first.animalId.age).toEqual(animalPayload.age);
    expect(first.animalId.image).toEqual(animalPayload.image);

    // animalId.ownerId populated
    expect(first.animalId.ownerId).toBeObject();
    expect(first.animalId.ownerId._id).toEqual(ownerId);
    expect(first.animalId.ownerId.firstName).toEqual(ownerPayload.firstName);
    expect(first.animalId.ownerId.lastName).toEqual(ownerPayload.lastName);
    expect(first.animalId.ownerId.email).toEqual(ownerPayload.email);
    expect(first.animalId.ownerId.phoneNumber).toEqual(ownerPayload.phoneNumber);

    // match fields
    expect(first.isActive).toBeBoolean();
    expect(first.isActive).toEqual(true);

    // discussion array should be empty
    expect(first.discussion).toBeArray();
    expect(first.discussion.length).toEqual(0);

    // mongoose metadata
    expect(first.createdAt).toBeString();
    expect(first.updatedAt).toBeString();
    expect(first.__v).toBeNumber();

    // keys present
    expect(first).toContainAllKeys([
      "_id",
      "adopterId",
      "animalId",
      "isActive",
      "discussion",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});

describe("DELETE /api/matches/:id", function () {
  test("should delete a match by id", async function () {
    // 1. Register owner
    const ownerRes = await supertest(app)
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = ownerRes.body.user._id;

    // 2. Register adopter
    const adopterRes = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const adopterId = adopterRes.body.user._id;
    const adopterToken = adopterRes.body.token;

    // 3. Create animal with ownerId
    const animalPayloadWithOwner = {
      ...animalPayload,
      ownerId,
    };

    const animalRes = await supertest(app)
      .post("/api/animals")
      .send(animalPayloadWithOwner)
      .expect(201);

    const animalId = animalRes.body.animal._id;

    // 4. Create match
    const matchPayload = {
      adopterId,
      animalId,
    };

    const createMatchRes = await supertest(app)
      .post("/api/matches")
      .set("Authorization", `Bearer ${adopterToken}`)
      .send(matchPayload)
      .expect(201);

    const matchId = createMatchRes.body.match._id;
    expect(matchId).toBeString();

    // 5. Verify match exists (GET before delete)
    const getRes = await supertest(app)
      .get("/api/matches")
      .expect(200);

    expect(getRes.body.matches).toBeArray();
    expect(getRes.body.matches.length).toBeGreaterThanOrEqual(1);
    const foundMatch = getRes.body.matches.find(m => m._id === matchId);
    expect(foundMatch).toBeDefined();

    // 6. Delete the match
    const deleteRes = await supertest(app)
      .delete(`/api/matches/${matchId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(deleteRes.body).toBeObject();
    expect(deleteRes.body.message).toEqual("Match deleted successfully");

    // 7. Verify match no longer exists (GET after delete)
    const getAfterDeleteRes = await supertest(app)
      .get("/api/matches")
      .expect(200);

    expect(getAfterDeleteRes.body.matches).toBeArray();
    expect(getAfterDeleteRes.body.matches.length).toEqual(0);
  });

  test("should return 404 when deleting non-existent match", async function () {
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .delete(`/api/matches/${fakeId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Match not found");
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
