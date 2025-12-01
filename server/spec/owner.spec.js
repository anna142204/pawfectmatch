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
  about: "Passionné par les animaux, je cherche une famille aimante pour mon compagnon fidèle."
};

beforeEach(async () => await cleanUpDatabase());  

describe("POST /api/auth/register/owner", function () {
  test("should register a new owner and return token + user", async function () {
    const res = await supertest(app)
      .post("/api/auth/register/owner")
      .send(ownerPayload)
      .expect(201)
      .expect("Content-Type", /json/);

    // top-level response
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Owner registered successfully");
    expect(res.body.token).toBeString();

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
      "phoneNumber",
      "about",
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

    // optional fields — assert only if present in the payload
    if (ownerPayload.societyName) expect(first.societyName).toEqual(ownerPayload.societyName);
    if (ownerPayload.phoneNumber) expect(first.phoneNumber).toEqual(ownerPayload.phoneNumber);
    if (ownerPayload.about) expect(first.about).toEqual(ownerPayload.about);

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
      "address",
      "phoneNumber",
      "about",
      "createdAt",
      "updatedAt",
      "__v",
    ]);
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});