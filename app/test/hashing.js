describe("Hashing", function() {
	var lib = require("../src/lib/hashing")
	describe("Salt", function() {
		it("Should be 16 bytes long, 32 hex chars", function() {
			var salt = lib.createSalt()
			salt.length.should.equal(32)
		})

		it("Should not generate the same salt twice", function() {
			var salt = lib.createSalt()
			salt.should.not.equal(lib.createSalt())
		})
	})

	describe("Hash", function() {
		it("Should generate the same hash twice with the same salt", function() {
			var salt = lib.createSalt()
			var hashed = lib.hash(salt, "test-password")
			hashed.should.equal(lib.hash(salt, "test-password"))
		})

		it("Should generate a different hash for same string different salt", function() {
			var salt1 = lib.createSalt()
			var hashed = lib.hash(salt1, "test-password")

			var salt2 = lib.createSalt()
			hashed.should.not.equal(lib.hash(salt2, "test-password"))
		})
	})

	describe("CreatePassword", function() {
		it("Should create different passwords for the same input", function() {
			var passw = lib.createPassword("test-password")
			passw.should.not.equal(lib.createPassword("test-password"))
		})
	})

	describe("isPasswordValid", function() {
		it("Should return true for the same input", function() {
			var passw = lib.createPassword("test-password")
			lib.isPasswordValid("test-password", passw).should.be.true
		})

		it("Should return false for input with different password", function() {
			var passw = lib.createPassword("test-password")
			lib.isPasswordValid("wrong-password", passw).should.be.false
		})
	})
})