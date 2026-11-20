import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { test } from "node:test";
import { loginSchema, registerSchema } from "../../src/validators/user.validator.js";
import type { UserDocument } from "../../src/models/user.model.js";
import type { UserRepository } from "../../src/repositories/user.repository.js";

process.env.JWT_SECRET = "unit-test-secret-that-is-long-enough-123456";
process.env.JWT_EXPIRES_IN = "1d";
process.env.BCRYPT_SALT_ROUNDS = "4";

const { AuthService } = await import("../../src/services/user.service.js");
const { default: app } = await import("../../src/app.js");

const validRegistration = {
  name: "John Doe",
  email: "John@Example.com",
  password: "Password@123",
  confirmPassword: "Password@123",
};

function createUser(
  values: { name?: string; email?: string; password?: string } = {},
): UserDocument {
  return {
    _id: new Types.ObjectId(),
    name: values.name ?? "John Doe",
    email: values.email ?? "john@example.com",
    password: values.password ?? "",
  } as UserDocument;
}

test("registration validation normalizes email and enforces password confirmation", () => {
  const parsed = registerSchema.safeParse(validRegistration);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.email, "john@example.com");
  }

  const invalid = registerSchema.safeParse({
    ...validRegistration,
    password: "weak",
    confirmPassword: "different",
  });
  assert.equal(invalid.success, false);
  if (!invalid.success) {
    assert.ok(invalid.error.issues.some((issue) => issue.path[0] === "password"));
    assert.ok(
      invalid.error.issues.some((issue) => issue.path[0] === "confirmPassword"),
    );
  }
});

test("login validation requires a valid email and non-empty password", () => {
  assert.equal(
    loginSchema.safeParse({ email: "john@example.com", password: "Password@123" })
      .success,
    true,
  );
  assert.equal(loginSchema.safeParse({ email: "invalid", password: "" }).success, false);
});

test("auth routes return structured validation errors before database access", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "J", email: "not-an-email", password: "weak" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.some((error: { field: string }) => error.field === "email"));

    const loginResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "" }),
      },
    );
    assert.equal(loginResponse.status, 400);
    assert.equal((await loginResponse.json()).success, false);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("registration hashes the password and returns a verifiable token without secrets", async () => {
  let createdUser: UserDocument | undefined;
  const repository: UserRepository = {
    async findByEmail() {
      return null;
    },
    async create(input) {
      createdUser = createUser(input);
      return createdUser;
    },
  };
  const service = new AuthService(repository);
  const input = registerSchema.parse(validRegistration);

  const result = await service.register(input);

  assert.ok(createdUser);
  assert.notEqual(createdUser.password, input.password);
  assert.equal(await bcrypt.compare(input.password, createdUser.password), true);
  assert.deepEqual(result.user, {
    id: createdUser._id.toString(),
    name: createdUser.name,
    email: createdUser.email,
  });
  assert.equal("password" in result.user, false);
  assert.equal(
    (jwt.verify(result.token, process.env.JWT_SECRET!) as jwt.JwtPayload).sub,
    result.user.id,
  );
});

test("registration rejects existing email and login accepts only the correct password", async () => {
  const passwordHash = await bcrypt.hash("Password@123", 4);
  const existingUser = createUser({ password: passwordHash });
  const repository: UserRepository = {
    async findByEmail() {
      return existingUser;
    },
    async create() {
      throw new Error("create should not run");
    },
  };
  const service = new AuthService(repository);

  await assert.rejects(
    service.register(registerSchema.parse(validRegistration)),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 409,
  );
  const loginResult = await service.login(
    loginSchema.parse({ email: "john@example.com", password: "Password@123" }),
  );
  assert.equal(loginResult.user.id, existingUser._id.toString());

  await assert.rejects(
    service.login(loginSchema.parse({ email: "john@example.com", password: "wrong" })),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 401,
  );
});

test("registration maps a concurrent duplicate-email insert to conflict", async () => {
  const repository: UserRepository = {
    async findByEmail() {
      return null;
    },
    async create() {
      throw Object.assign(new Error("duplicate key"), { code: 11000 });
    },
  };
  const service = new AuthService(repository);

  await assert.rejects(
    service.register(registerSchema.parse(validRegistration)),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 409,
  );
});
