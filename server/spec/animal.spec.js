import supertest from "supertest";
import app from "../app.mjs";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

// Helper function to create and authenticate an owner
async function createAuthenticatedOwner() {
  const ownerPayload = {
    firstName: "Test",
    lastName: "Owner",
    email: `owner${Date.now()}@test.com`,
    password: "securePassword123",
    phoneNumber: "+41 79 123 45 67",
    address: { zip: "1000", city: "Lausanne" },
    about: "Test owner for animal tests",
    image: "https://i.pravatar.cc/150?u=testowner"
  };

  const res = await supertest(app)
    .post("/api/auth/register/owner")
    .send(ownerPayload)
    .expect(201);

  return {
    ownerId: res.body.user._id,
    token: res.body.token
  };
}

// reusable payload for POST and GET tests
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
  ownerId: "64a1b2c3d4e5f67890123456",
  availability: true,
  description:
    "Affectionate Labrador looking for a loving home. Good with children and other pets.",
  characteristics: {
    environment: ["appartement", "chien"],
    dressage: ["éduqué", "habitué à la laisse"],
    personality: ["affectueux", "joueur", "sociable"],
  },
};

beforeEach(cleanUpDatabase);
describe("POST /api/animals", function () {
  test("should create a new animal", async function () {
    const { ownerId, token } = await createAuthenticatedOwner();
    
    const payload = { ...animalPayload, ownerId };
    
    const res = await supertest(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect("Content-Type", /json/);

    // response shape: { message: "...", animal: { ... } }
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Animal créé avec succès");

    const created = res.body.animal;

    // Jest / jest-extended assertions matching the model & payload
    expect(created).toBeObject();
    expect(created._id).toBeString();
    expect(created.name).toEqual(payload.name);
    expect(created.species).toEqual(payload.species);
    expect(created.race).toEqual(payload.race);
    expect(created.age).toBeString();
    expect(created.age).toEqual(payload.age);
    expect(created.sex).toBeOneOf(["male", "female"]);
    
    if (payload.size) {
      expect(created.size).toBeString();
      expect(created.size).toEqual(payload.size);
    }
    if (payload.weight) {
      expect(created.weight).toBeString();
      expect(created.weight).toEqual(payload.weight);
    }

    expect(created.address).toBeObject();
    expect(created.address).toContainAllKeys(["city", "zip"]);
    expect(created.address.city).toEqual(payload.address.city);
    expect(created.address.zip).toEqual(payload.address.zip);

    expect(created.location).toBeObject();
    expect(created.location.type).toEqual("Point");
    expect(created.location.coordinates).toBeArray();
    expect(created.location.coordinates).toHaveLength(2);

    expect(created.images).toBeArray();
    expect(created.images.length).toBeGreaterThan(0);
    expect(created.images).toIncludeSameMembers(payload.images);
    expect(created.price).toBeNumber();
    expect(created.price).toEqual(payload.price);
    expect(created.ownerId).toBeString();
    expect(created.ownerId).toEqual(ownerId);
    expect(created.availability).toBeBoolean();
    expect(created.description).toBeString();
    expect(created.description).toEqual(payload.description);

    expect(created.characteristics).toBeObject();
    expect(created.characteristics.environment).toBeArray();
    expect(created.characteristics.environment).toIncludeSameMembers(
      payload.characteristics.environment
    );
    expect(created.characteristics.dressage).toBeArray();
    expect(created.characteristics.dressage).toIncludeSameMembers(
      payload.characteristics.dressage
    );
    expect(created.characteristics.personality).toBeArray();
    expect(created.characteristics.personality).toIncludeSameMembers(
      payload.characteristics.personality
    );

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
      "size",
      "weight",
      "address",
      "location",
      "images",
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

beforeEach(cleanUpDatabase);
describe("GET /api/animals", function () {
  test("should retrieve the list of animals", async function () {
    const { ownerId, token } = await createAuthenticatedOwner();
    const payload = { ...animalPayload, ownerId };
    
    // create an animal using the same payload
    await supertest(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const res = await supertest(app)
      .get("/api/animals")
      .expect(200)
      .expect("Content-Type", /json/);

    // top-level shape
    expect(res.body).toBeObject();
    expect(res.body.animals).toBeArray();
    expect(res.body.pagination).toBeObject();

    // first animal should match payload (plus mongoose metadata)
    const first = res.body.animals[0];
    expect(first).toBeObject();
    expect(first._id).toBeString();
    expect(first.species).toEqual(payload.species);
    expect(first.race).toEqual(payload.race);
    expect(first.name).toEqual(payload.name);
    expect(first.age).toBeString();
    expect(first.age).toEqual(payload.age);
    expect(first.sex).toBeOneOf(["male", "female"]);
    
    if (payload.size) {
      expect(first.size).toBeString();
      expect(first.size).toEqual(payload.size);
    }
    if (payload.weight) {
      expect(first.weight).toBeString();
      expect(first.weight).toEqual(payload.weight);
    }

    expect(first.address).toBeObject();
    expect(first.address.city).toEqual(payload.address.city);
    expect(first.address.zip).toEqual(payload.address.zip);

    expect(first.location).toBeObject();
    expect(first.location.type).toEqual("Point");
    expect(first.location.coordinates).toBeArray();

    expect(first.images).toBeArray();
    expect(first.images.length).toBeGreaterThan(0);
    expect(first.price).toBeNumber();
    expect(first.price).toEqual(payload.price);

    // Check owner is populated
    expect(first.owner).toBeObject();
    expect(first.owner._id).toBeString();

    expect(first.availability).toBeBoolean();
    expect(first.description).toBeString();

    expect(first.characteristics).toBeObject();
    expect(first.characteristics.environment).toBeArray();
    expect(first.characteristics.environment).toIncludeSameMembers(
      payload.characteristics.environment
    );
    expect(first.characteristics.dressage).toBeArray();
    expect(first.characteristics.dressage).toIncludeSameMembers(
      payload.characteristics.dressage
    );
    expect(first.characteristics.personality).toBeArray();
    expect(first.characteristics.personality).toIncludeSameMembers(
      payload.characteristics.personality
    );

    // mongoose metadata (only createdAt is included in aggregation $project)
    expect(first.createdAt).toBeString();
  });
});

beforeEach(async () => await cleanUpDatabase());
describe("GET /api/animals/:id", function () {
  test("should retrieve an animal by id and populate owner", async function () {
    // 1. Register an owner and get auth token
    const { ownerId, token } = await createAuthenticatedOwner();

    // 2. Create an animal that references the owner
    const animalPayloadWithOwner = {
      ...animalPayload,
      ownerId,
    };

    const createRes = await supertest(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send(animalPayloadWithOwner)
      .expect(201)
      .expect("Content-Type", /json/);

    const animalId = createRes.body.animal._id;
    expect(animalId).toBeString();

    // 3. Fetch by id
    const res = await supertest(app)
      .get(`/api/animals/${animalId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions on animal
    const fetched = res.body;
    expect(fetched).toBeObject();
    expect(fetched._id).toEqual(animalId);
    expect(fetched.name).toEqual(animalPayload.name);
    expect(fetched.species).toEqual(animalPayload.species);
    expect(fetched.race).toEqual(animalPayload.race);
    expect(fetched.age).toBeString();
    expect(fetched.age).toEqual(animalPayload.age);
    expect(fetched.address).toBeObject();
    expect(fetched.address.city).toEqual(animalPayload.address.city);
    expect(fetched.address.zip).toEqual(animalPayload.address.zip);

    // Owner must be populated with selected fields
    expect(fetched.ownerId).toBeObject();
    expect(fetched.ownerId._id).toBeString();
    expect(fetched.ownerId._id).toEqual(ownerId);
    expect(fetched.ownerId.firstName).toBeString();
    expect(fetched.ownerId.lastName).toBeString();
    expect(fetched.ownerId.email).toBeString();
    expect(fetched.ownerId.phoneNumber).toBeString();
    expect(fetched.ownerId.address).toBeObject();
    expect(fetched.ownerId.address.city).toBeString();
    expect(fetched.ownerId.address.zip).toBeString();
  });

  test("should return 404 when animal does not exist", async function () {
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .get(`/api/animals/${fakeId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Animal not found");
  });
});

beforeEach(async () => await cleanUpDatabase());
describe("DELETE /api/animals/:id", function () {
  test("should delete an animal by id", async function () {
    const { ownerId, token } = await createAuthenticatedOwner();
    const payload = { ...animalPayload, ownerId };
    
    // 1. Create an animal
    const createRes = await supertest(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const animalId = createRes.body.animal._id;
    expect(animalId).toBeString();

    // 2. Verify animal exists (GET before delete)
    const getRes = await supertest(app)
      .get("/api/animals")
      .expect(200);

    expect(getRes.body.animals).toBeArray();
    expect(getRes.body.animals.length).toBeGreaterThanOrEqual(1);
    const foundAnimal = getRes.body.animals.find(a => a._id === animalId);
    expect(foundAnimal).toBeDefined();

    // 3. Delete the animal
    const deleteRes = await supertest(app)
      .delete(`/api/animals/${animalId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(deleteRes.body).toBeObject();
    expect(deleteRes.body.message).toEqual("Animal deleted successfully");

    // 4. Verify animal no longer exists (GET after delete)
    const getAfterDeleteRes = await supertest(app)
      .get("/api/animals")
      .expect(200);

    expect(getAfterDeleteRes.body.animals).toBeArray();
    expect(getAfterDeleteRes.body.animals.length).toEqual(0);
  });

  test("should return 404 when deleting non-existent animal", async function () {
    const { token } = await createAuthenticatedOwner();
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .delete(`/api/animals/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Animal introuvable ou accès non autorisé");
  });
});

beforeEach(async () => await cleanUpDatabase());
describe("PUT /api/animals/:id", function () {
  test("should update an animal by id", async function () {
    const { ownerId, token } = await createAuthenticatedOwner();
    const payload = { ...animalPayload, ownerId };
    
    // 1. Create an animal
    const createRes = await supertest(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const animalId = createRes.body.animal._id;
    expect(animalId).toBeString();

    // 2. Update payload
    const updatePayload = {
      name: "Buddy Updated",
      price: 200,
      availability: false,
      description: "Updated description for Buddy",
      characteristics: {
        environment: ["appartement"],
        dressage: ["éduqué"],
        personality: ["affectueux", "joueur"]
      }
    };

    // 3. Perform update
    const res = await supertest(app)
      .put(`/api/animals/${animalId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatePayload)
      .expect(200)
      .expect("Content-Type", /json/);

    // Assertions
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Animal updated successfully");

    const updated = res.body.animal;
    expect(updated).toBeObject();
    expect(updated._id).toEqual(animalId);
    expect(updated.name).toEqual(updatePayload.name);
    expect(updated.price).toBeNumber();
    expect(updated.price).toEqual(updatePayload.price);
    expect(updated.availability).toBeBoolean();
    expect(updated.availability).toEqual(updatePayload.availability);
    expect(updated.description).toBeString();
    expect(updated.description).toEqual(updatePayload.description);

    expect(updated.characteristics).toBeObject();
    expect(updated.characteristics.environment).toBeArray();
    expect(updated.characteristics.environment).toIncludeSameMembers(updatePayload.characteristics.environment);
    expect(updated.characteristics.dressage).toBeArray();
    expect(updated.characteristics.dressage).toIncludeSameMembers(updatePayload.characteristics.dressage);
    expect(updated.characteristics.personality).toBeArray();
    expect(updated.characteristics.personality).toIncludeSameMembers(updatePayload.characteristics.personality);

    // mongoose metadata
    expect(updated.updatedAt).toBeString();
    expect(updated.__v).toBeNumber();
  });

  test("should return 404 when updating non-existent animal", async function () {
    const { token } = await createAuthenticatedOwner();
    const fakeId = "64a1b2c3d4e5f67890123456";

    const res = await supertest(app)
      .put(`/api/animals/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nope" })
      .expect(404)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.error).toEqual("Animal introuvable ou accès non autorisé");
  });
});


afterAll(async () => {
  await mongoose.disconnect();
});
