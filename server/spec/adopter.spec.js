import supertest from "supertest";
import app from "../app.mjs";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

// reusable payload for POST and GET tests
const adopterPayload = {
  firstName: "Marie",
  lastName: "Martin",
  email: "marie.martin@example.com",
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
};

beforeEach(async () => await cleanUpDatabase());

describe("POST /api/auth/register/adopter", function () {
  test("should register a new adopter and return token + user", async function () {
    const res = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201)
      .expect("Content-Type", /json/);

    // top-level response
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Adopter registered successfully");
    expect(res.body.token).toBeString();

    const user = res.body.user;
    expect(user).toBeObject();

    // user fields
    expect(user._id).toBeString();
    expect(user.firstName).toEqual(adopterPayload.firstName);
    expect(user.lastName).toEqual(adopterPayload.lastName);
    expect(user.email).toEqual(adopterPayload.email);
    expect(user.age).toBeNumber();
    expect(user.age).toEqual(adopterPayload.age);

    // address
    expect(user.address).toBeObject();
    expect(user.address.zip).toEqual(adopterPayload.address.zip);
    expect(user.address.city).toEqual(adopterPayload.address.city);

    // about
    if (adopterPayload.about) expect(user.about).toEqual(adopterPayload.about);

    // preferences
    expect(user.preferences).toBeObject();
    expect(user.preferences.environment).toBeArray();
    expect(user.preferences.environment).toIncludeSameMembers(
      adopterPayload.preferences.environment
    );
    expect(user.preferences.species).toBeArray();
    expect(user.preferences.species).toIncludeSameMembers(
      adopterPayload.preferences.species
    );
    expect(user.preferences.sizePreference).toBeArray();
    expect(user.preferences.sizePreference).toIncludeSameMembers(
      adopterPayload.preferences.sizePreference
    );

    // mongoose metadata
    expect(user.createdAt).toBeString();
    expect(user.updatedAt).toBeString();
    expect(user.__v).toBeNumber();

    // basic keys present
    expect(user).toContainAllKeys([
      "_id",
      "firstName",
      "lastName",
      "email",
      "age",
      "address",
      "about",
      "preferences",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});


beforeEach(async () => await cleanUpDatabase());
describe("GET /api/adopters", function () {
  test("should retrieve the list of adopters", async function () {
    // register an adopter using the registration endpoint (same payload as POST test)
    await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const res = await supertest(app)
      .get("/api/adopters")
      .expect(200)
      .expect("Content-Type", /json/);

    // top-level shape
    expect(res.body).toBeObject();
    expect(res.body.adopters).toBeArray();
    expect(res.body.pagination).toBeObject();

    // pagination checks
    expect(res.body.pagination.total).toBeNumber();
    expect(res.body.pagination.page).toBeNumber();
    expect(res.body.pagination.limit).toBeNumber();
    expect(res.body.pagination.pages).toBeNumber();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);

    // first adopter should match payload (plus mongoose metadata)
    const first = res.body.adopters[0];
    expect(first).toBeObject();
    expect(first._id).toBeString();
    expect(first.firstName).toEqual(adopterPayload.firstName);
    expect(first.lastName).toEqual(adopterPayload.lastName);
    expect(first.email).toEqual(adopterPayload.email);
    expect(first.age).toBeNumber();
    expect(first.age).toEqual(adopterPayload.age);

    expect(first.address).toBeObject();
    expect(first.address.city).toEqual(adopterPayload.address.city);
    expect(first.address.zip).toEqual(adopterPayload.address.zip);

    if (adopterPayload.about) expect(first.about).toEqual(adopterPayload.about);

    // preferences
    expect(first.preferences).toBeObject();
    expect(first.preferences.environment).toBeArray();
    expect(first.preferences.environment).toIncludeSameMembers(
      adopterPayload.preferences.environment
    );
    expect(first.preferences.species).toBeArray();
    expect(first.preferences.species).toIncludeSameMembers(
      adopterPayload.preferences.species
    );
    expect(first.preferences.sizePreference).toBeArray();
    expect(first.preferences.sizePreference).toIncludeSameMembers(
      adopterPayload.preferences.sizePreference
    );

    // mongoose metadata
    expect(first.createdAt).toBeString();
    expect(first.updatedAt).toBeString();
    expect(first.__v).toBeNumber();

    // keys present
    expect(first).toContainAllKeys([
      "_id",
      "firstName",
      "lastName",
      "email",
      "age",
      "address",
      "about",
      "preferences",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});


beforeEach(async () => await cleanUpDatabase());
describe("DELETE /api/adopters/:id", function () {
  test("should delete an adopter by id", async function () {
    // 1. Register an adopter
    const createRes = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const adopterId = createRes.body.user._id;
    expect(adopterId).toBeString();

    // 2. Verify adopter exists (GET before delete)
    const getRes = await supertest(app)
      .get("/api/adopters")
      .expect(200);

    expect(getRes.body.adopters).toBeArray();
    expect(getRes.body.adopters.length).toBeGreaterThanOrEqual(1);
    const foundAdopter = getRes.body.adopters.find(a => a._id === adopterId);
    expect(foundAdopter).toBeDefined();

    // 3. Delete the adopter
    const deleteRes = await supertest(app)
      .delete(`/api/adopters/${adopterId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(deleteRes.body).toBeObject();
    expect(deleteRes.body.message).toEqual("Adopter deleted successfully");

    // 4. Verify adopter no longer exists (GET after delete)
    const getAfterDeleteRes = await supertest(app)
      .get("/api/adopters")
      .expect(200);

    expect(getAfterDeleteRes.body.adopters).toBeArray();
    expect(getAfterDeleteRes.body.adopters.length).toEqual(0);
  });

  test("should return 404 when deleting non-existent adopter", async function () {
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .delete(`/api/adopters/${fakeId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Adopter not found");
  });
});


beforeEach(async () => await cleanUpDatabase());
describe("PUT /api/adopters/:id", function () {
  test("should update adopter fields and ignore password", async function () {
    // 1. Register an adopter
    const createRes = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const adopterId = createRes.body.user._id;
    expect(adopterId).toBeString();

    // 2. Update fields (including a password which must be ignored)
    const updatePayload = {
      firstName: "UpdatedName",
      about: "Nouvelle description",
      address: { city: "Lausanne", zip: "1000" },
      preferences: {
        environment: ["appartement"],
        species: ["chat"],
        sizePreference: ["petit"]
      },
      password: "newPasswordShouldBeIgnored"
    };

    const res = await supertest(app)
      .put(`/api/adopters/${adopterId}`)
      .send(updatePayload)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Adopter updated successfully");

    const adopter = res.body.adopter;
    expect(adopter).toBeObject();
    expect(adopter._id).toEqual(adopterId);
    expect(adopter.firstName).toEqual(updatePayload.firstName);
    expect(adopter.about).toEqual(updatePayload.about);
    expect(adopter.address).toBeObject();
    expect(adopter.address.city).toEqual(updatePayload.address.city);
    expect(adopter.address.zip).toEqual(updatePayload.address.zip);

    expect(adopter.preferences).toBeObject();
    expect(adopter.preferences.environment).toBeArray();
    expect(adopter.preferences.environment).toIncludeSameMembers(updatePayload.preferences.environment);
    expect(adopter.preferences.species).toBeArray();
    expect(adopter.preferences.species).toIncludeSameMembers(updatePayload.preferences.species);
    expect(adopter.preferences.sizePreference).toBeArray();
    expect(adopter.preferences.sizePreference).toIncludeSameMembers(updatePayload.preferences.sizePreference);

    // password must not be returned/updated via this route
    expect(adopter.password).toBeUndefined();

    // mongoose metadata
    expect(adopter.updatedAt).toBeString();
    expect(adopter.__v).toBeNumber();
  });

  test("should return 404 when updating non-existent adopter", async function () {
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .put(`/api/adopters/${fakeId}`)
      .send({ firstName: "Nope" })
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Adopter not found");
  });
});


beforeEach(async () => await cleanUpDatabase());
describe("GET /api/adopters/:id", function () {
  test("should retrieve an adopter by id", async function () {
    // 1. Register an adopter
    const createRes = await supertest(app)
      .post("/api/auth/register/adopter")
      .send(adopterPayload)
      .expect(201);

    const adopterId = createRes.body.user._id;
    expect(adopterId).toBeString();

    // 2. Fetch adopter by id
    const res = await supertest(app)
      .get(`/api/adopters/${adopterId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    const fetched = res.body;
    expect(fetched).toBeObject();
    expect(fetched._id).toEqual(adopterId);
    expect(fetched.firstName).toEqual(adopterPayload.firstName);
    expect(fetched.lastName).toEqual(adopterPayload.lastName);
    expect(fetched.email).toEqual(adopterPayload.email);
    expect(fetched.age).toBeNumber();
    expect(fetched.age).toEqual(adopterPayload.age);

    // address
    expect(fetched.address).toBeObject();
    expect(fetched.address.zip).toEqual(adopterPayload.address.zip);
    expect(fetched.address.city).toEqual(adopterPayload.address.city);

    // about
    if (adopterPayload.about) expect(fetched.about).toEqual(adopterPayload.about);

    // preferences
    expect(fetched.preferences).toBeObject();
    expect(fetched.preferences.environment).toBeArray();
    expect(fetched.preferences.environment).toIncludeSameMembers(
      adopterPayload.preferences.environment
    );
    expect(fetched.preferences.species).toBeArray();
    expect(fetched.preferences.species).toIncludeSameMembers(
      adopterPayload.preferences.species
    );
    expect(fetched.preferences.sizePreference).toBeArray();
    expect(fetched.preferences.sizePreference).toIncludeSameMembers(
      adopterPayload.preferences.sizePreference
    );

    // mongoose metadata
    expect(fetched.createdAt).toBeString();
    expect(fetched.updatedAt).toBeString();
    expect(fetched.__v).toBeNumber();

    // basic keys present
    expect(fetched).toContainAllKeys([
      "_id",
      "firstName",
      "lastName",
      "email",
      "age",
      "address",
      "about",
      "preferences",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });

  test("should return 404 when adopter does not exist", async function () {
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .get(`/api/adopters/${fakeId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Adopter not found");
  });
});


afterAll(async () => {
  await mongoose.disconnect();
});

