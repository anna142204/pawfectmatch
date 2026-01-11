import supertest from "supertest";
import app from "../app.mjs";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";


// reusable payload for POST and GET tests
const ownerPayload ={
  firstName: "Joanah",
  lastName: "Doe",
  email: "joanah.doe@example.com",
  password: "securePassword123",
  address: {
    zip: "1000",
    city: "Lausanne"
  },
  phoneNumber: "+41 79 123 45 67",
  about: "Passionné par les animaux, je cherche une famille aimante pour mon compagnon fidèle.",
  image: "https://i.pravatar.cc/150?u=joanah.doe@example.com"
};

beforeEach(async () => await cleanUpDatabase());  

describe("POST /api/auth/register/owner", function () {
  test("should register a new owner and return user", async function () {
    const res = await supertest(app)
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201)
      .expect("Content-Type", /json/);

    // top-level response
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Inscription réussie");

    const user = res.body.user;
    expect(user).toBeObject();

    // user fields
    expect(user._id).toBeString();
    expect(user.firstName).toEqual(ownerPayload.firstName);
    expect(user.lastName).toEqual(ownerPayload.lastName);
    expect(user.email).toEqual(ownerPayload.email);

    // address
    expect(user.address).toBeObject();
    expect(user.address.zip).toEqual(ownerPayload.address.zip);
    expect(user.address.city).toEqual(ownerPayload.address.city);

    // location
    expect(user.location).toBeObject();
    expect(user.location.type).toEqual("Point");
    expect(user.location.coordinates).toBeArray();
    expect(user.location.coordinates).toHaveLength(2);

    expect(user.image).toEqual(ownerPayload.image);

    // optional fields
    if (ownerPayload.phoneNumber) expect(user.phoneNumber).toEqual(ownerPayload.phoneNumber);
    if (ownerPayload.societyName) expect(user.societyName).toEqual(ownerPayload.societyName);
    if (ownerPayload.about) expect(user.about).toEqual(ownerPayload.about);

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
      "address",
      "location",
      "phoneNumber",
      "about",
      "image",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});

beforeEach(async () => await cleanUpDatabase()); 
describe("GET /api/owners", function () {
  test("should retrieve the list of owners", async function () {
    // create an owner using the registration endpoint (same payload as POST test)
    await supertest(app)
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const res = await supertest(app)
      .get("/api/owners")
      .expect(200)
      .expect("Content-Type", /json/);

    // top-level shape
    expect(res.body).toBeObject();
    expect(res.body.owners).toBeArray();
    expect(res.body.pagination).toBeObject();

    // pagination checks
    expect(res.body.pagination.total).toBeNumber();
    expect(res.body.pagination.page).toBeNumber();
    expect(res.body.pagination.limit).toBeNumber();
    expect(res.body.pagination.pages).toBeNumber();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);

    // first owner should match payload (plus mongoose metadata)
    const first = res.body.owners[0];
    expect(first).toBeObject();
    expect(first._id).toBeString();
    expect(first.firstName).toEqual(ownerPayload.firstName);
    expect(first.lastName).toEqual(ownerPayload.lastName);
    expect(first.email).toEqual(ownerPayload.email);

    expect(first.address).toBeObject();
    expect(first.address.city).toEqual(ownerPayload.address.city);
    expect(first.address.zip).toEqual(ownerPayload.address.zip);

    expect(first.location).toBeObject();
    expect(first.location.type).toEqual("Point");
    expect(first.location.coordinates).toBeArray();

    expect(first.image).toEqual(ownerPayload.image);

    // animalCount added by aggregation
    expect(first.animalCount).toBeNumber();

    // optional fields — assert only if present in the payload
    if (ownerPayload.societyName) expect(first.societyName).toEqual(ownerPayload.societyName);
    if (ownerPayload.phoneNumber) expect(first.phoneNumber).toEqual(ownerPayload.phoneNumber);
    if (ownerPayload.about) expect(first.about).toEqual(ownerPayload.about);

    // mongoose metadata (no __v in aggregation result)
    expect(first.createdAt).toBeString();
    expect(first.updatedAt).toBeString();

    // keys present
    expect(first).toContainAllKeys([
      "_id",
      "firstName",
      "lastName",
      "email",
      "address",
      "location",
      "phoneNumber",
      "about",
      "image",
      "animalCount",
      "createdAt",
      "updatedAt",
    ]);
  });
});

beforeEach(async () => await cleanUpDatabase());
describe("DELETE /api/owners/:id", function () {
  test("should delete an owner without associated animals", async function () {
    const agent = supertest.agent(app)
    // 1. Register an owner
    const createRes = await agent
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = createRes.body.user._id;
    expect(ownerId).toBeString();

    // 2. Verify owner exists (GET before delete)
    const getRes = await supertest(app)
      .get("/api/owners")
      .expect(200);

    expect(getRes.body.owners).toBeArray();
    expect(getRes.body.owners.length).toBeGreaterThanOrEqual(1);
    const foundOwner = getRes.body.owners.find(o => o._id === ownerId);
    expect(foundOwner).toBeDefined();

    // 3. Delete the owner
    const deleteRes = await agent
      .delete(`/api/owners/${ownerId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(deleteRes.body).toBeObject();
    expect(deleteRes.body.message).toEqual("Owner deleted successfully");

    // 4. Verify owner no longer exists (GET after delete)
    const getAfterDeleteRes = await supertest(app)
      .get("/api/owners")
      .expect(200);

    expect(getAfterDeleteRes.body.owners).toBeArray();
    expect(getAfterDeleteRes.body.owners.length).toEqual(0);
  });

  test("should return 403 when deleting another owner's account", async function () {
    const agent = supertest.agent(app)
    // Create an owner to get an authenticated session (cookie)
    const authRes = await agent
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await agent
      .delete(`/api/owners/${fakeId}`)
      .expect(403)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Accès interdit : vous ne pouvez accéder qu'à vos propres données");
  });

  test("should return 400 when deleting owner with associated animals", async function () {
    const agent = supertest.agent(app)
    // 1. Register an owner
    const createRes = await agent
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = createRes.body.user._id;

    // 2. Create an animal for this owner
    const animalPayload = {
      species: "chien",
      race: "Labrador",
      name: "Buddy",
      age: "1-3",
      sex: "male",
      size: "grand",
      weight: "20-30",
      address: { city: "Lausanne", zip: "1004" },
      images: ["https://example.com/images/buddy.jpg"],
      price: 150,
      ownerId,
      availability: true,
      description: "Affectionate Labrador looking for a loving home.",
      characteristics: {
        environment: ["appartement", "chien"],
        dressage: ["éduqué", "habitué à la laisse"],
        personality: ["affectueux", "joueur", "sociable"],
      },
    };

    await agent
      .post("/api/animals")
      .send(animalPayload)
      .expect(201);

    // 3. Try to delete owner with associated animal
    const deleteRes = await agent
      .delete(`/api/owners/${ownerId}`)
      .expect(400)
      .expect("Content-Type", /json/);

    // Assertions
    expect(deleteRes.body).toBeObject();
    expect(deleteRes.body.error).toEqual("Cannot delete owner with associated animals");
    expect(deleteRes.body.animalsCount).toBeNumber();
    expect(deleteRes.body.animalsCount).toEqual(1);

    // 4. Verify owner still exists
    const getRes = await supertest(app)
      .get("/api/owners")
      .expect(200);

    expect(getRes.body.owners).toBeArray();
    expect(getRes.body.owners.length).toEqual(1);
  });
});


beforeEach(async () => await cleanUpDatabase());
describe("GET /api/owners/:id", function () {
  test("should retrieve an owner by id with their animals", async function () {
    const agent = supertest.agent(app)
    // 1. Register an owner
    const ownerRes = await agent
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = ownerRes.body.user._id;
    expect(ownerId).toBeString();

    // 2. Create animals for this owner
    const baseAnimal = {
      species: "chien",
      race: "Labrador",
      age: "1-3",
      sex: "male",
      size: "grand",
      weight: "20-30",
      address: { city: "Lausanne", zip: "1004" },
      images: ["https://example.com/images/buddy.jpg"],
      price: 150,
      ownerId,
      availability: true,
      description: "Friendly and energetic dog",
      characteristics: {
        environment: ["appartement", "chien"],
        dressage: ["éduqué", "habitué à la laisse"],
        personality: ["affectueux", "joueur", "sociable"],
      },
    };

    const animal1 = { ...baseAnimal, name: "Buddy" };
    const animal2 = { ...baseAnimal, name: "Max" };

    await agent.post("/api/animals").send(animal1).expect(201);
    await agent.post("/api/animals").send(animal2).expect(201);

    // 3. Fetch owner by id
    const res = await supertest(app)
      .get(`/api/owners/${ownerId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    const fetched = res.body;
    expect(fetched).toBeObject();
    expect(fetched._id).toEqual(ownerId);
    expect(fetched.firstName).toEqual(ownerPayload.firstName);
    expect(fetched.lastName).toEqual(ownerPayload.lastName);
    expect(fetched.email).toEqual(ownerPayload.email);

    expect(fetched.address).toBeObject();
    expect(fetched.address.city).toEqual(ownerPayload.address.city);
    expect(fetched.address.zip).toEqual(ownerPayload.address.zip);

    if (ownerPayload.phoneNumber) expect(fetched.phoneNumber).toEqual(ownerPayload.phoneNumber);
    if (ownerPayload.about) expect(fetched.about).toEqual(ownerPayload.about);

    expect(fetched.animals).toBeArray();
    expect(fetched.animals).toHaveLength(2);
    const names = fetched.animals.map((a) => a.name);
    expect(names).toIncludeSameMembers(["Buddy", "Max"]);
    fetched.animals.forEach((a) => {
      expect(a.ownerId).toEqual(ownerId);
      expect(a.species).toEqual(baseAnimal.species);
    });

    expect(fetched.createdAt).toBeString();
    expect(fetched.updatedAt).toBeString();
    expect(fetched.__v).toBeNumber();
  });

  test("should return 404 when owner does not exist", async function () {
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .get(`/api/owners/${fakeId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Owner not found");
  });
});

//write the PUT test here

beforeEach(async () => await cleanUpDatabase());
describe("PUT /api/owners/:id", function () {
  test("should update an owner and return the updated document", async function () {
    const agent = supertest.agent(app)
    // 1. Register an owner
    const createRes = await agent
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const ownerId = createRes.body.user._id;

    // 2. Prepare updates (password should be ignored)
    const updates = {
      firstName: "Updated",
      lastName: "Owner",
      phoneNumber: "+41 78 000 00 00",
      about: "Updated bio",
      address: { city: "Geneva", zip: "1200" },
      password: "shouldNotBeUpdated",
    };

    // 3. Update owner
    const res = await agent
      .put(`/api/owners/${ownerId}`)
      .send(updates)
      .expect(200)
      .expect("Content-Type", /json/);

    // 4. Assertions
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Owner updated successfully");
    expect(res.body.owner).toBeObject();

    const updated = res.body.owner;
    expect(updated._id).toEqual(ownerId);
    expect(updated.firstName).toEqual(updates.firstName);
    expect(updated.lastName).toEqual(updates.lastName);
    expect(updated.phoneNumber).toEqual(updates.phoneNumber);
    expect(updated.about).toEqual(updates.about);
    expect(updated.address).toBeObject();
    expect(updated.address.city).toEqual(updates.address.city);
    expect(updated.address.zip).toEqual(updates.address.zip);

    // The password should not be returned/updated via this route
    expect(updated.password).toBeUndefined();

    expect(updated.createdAt).toBeString();
    expect(updated.updatedAt).toBeString();
    expect(updated.__v).toBeNumber();
  });

  test("should return 403 when updating another owner's account", async function () {
    const agent = supertest.agent(app)
    // Create an owner to get authenticated session
    const authRes = await agent
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201);

    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await agent
      .put(`/api/owners/${fakeId}`)
      .send({ firstName: "Nobody" })
      .expect(403)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Accès interdit : vous ne pouvez accéder qu'à vos propres données");
  });
});


afterAll(async () => {
  await mongoose.disconnect();
});