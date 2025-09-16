#  GS1 Verifiable Credential Verifier Monorepo

This repository combines two related libraries involved in verifying GS1 Verifiable Presentations (VPs):

- **gs1-vc-verifier (RepoA)**: A TypeScript/Node.js library that provides signature verification, revocation checks, and initial schema validation of verifiable presentations.
- **vc-verifier-rules (RepoB)**: A JavaScript/Node.js prebuilt library that implements GS1-specific rules validation, applied after the initial checks from `gs1-vc-verifier`.

---

## 📂 Project Structure
new-folder/
├── gs1-vc-verifier/
├── vc-verifier-rules/
### gs1-vc-verifier/

- Responsible for three core verification steps:  
  1. Signature verification  
  2. Revocation status check  
  3. Initial JSON schema validation

- Written in TypeScript and runs on Node.js.  
- Testing options include:  
  - Running Jest test cases  
  - Running the verifier directly via:  
    ```bash
    npx ts-node src/core/verifier.ts
    ```  
    You can customize input functions within the file for testing purposes.

### vc-verifier-rules/

- Responsible for verifying GS1-specific compliance rules after initial validation by `gs1-vc-verifier`.  
- Implemented in JavaScript and runs on Node.js.  
- Must be updated regularly to stay compliant with GS1 US standards.

---

## 🚀 Getting Started

### Step 1: Setup and run `vc-verifier-rules`

```bash
cd vc-verifier-rules
npm install
npm run dev
```
### Step 2: Setup and build `gs1-vc-verifier`
```bash
cd ../gs1-vc-verifier
npm install
npm run build
```

	•	The build will generate a dist/ directory inside gs1-vc-verifier.
	•	This can be used to run tests and integrate the verifier in your projects.


🧑‍💻 Development Workflow
	•	First, run vc-verifier-rules to perform GS1 rules validation.
	•	Then use gs1-vc-verifier for signature, revocation, and schema checks.
	•	Update vc-verifier-rules as GS1 US compliance evolves.

⚙️ Environment Variables

No environment variables are required for either project.

🚦 Deployment

These are libraries intended for integration; no deployment setup is included at this time.

✅ Contributing
	1.	Fork the repository.
	2.	Create a new feature branch:
