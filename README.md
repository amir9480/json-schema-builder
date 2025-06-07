# ✨ JSON Schema Builder & AI Generator ✨

Welcome to the **JSON Schema Builder & AI Generator**! This application provides an intuitive, drag-and-drop interface for visually constructing JSON schemas. Beyond manual field definition, it leverages the power of AI to generate schemas from natural language prompts and even refine existing fields. You can also preview your schema as a form, generate sample data, and export code snippets for various programming languages and API calls.

## 🚀 Features

*   **Visual Schema Building**: Drag-and-drop interface to easily add, reorder, and nest schema fields.
*   **Diverse Field Types**: Support for common JSON Schema types including string, integer, float, boolean, date, datetime, currency, object, and dropdowns.
*   **Advanced Field Options**: Configure titles, descriptions, examples, min/max values, and array item constraints.
*   **Reusable Types ($ref)**: Define complex object schemas once and reuse them across your main schema, promoting consistency and reducing redundancy.
*   **AI-Powered Schema Generation**:
    *   **Generate from Prompt**: Describe your desired schema in plain English, and let AI build it for you.
    *   **Refine Fields**: Select any field and use AI to refine its properties (e.g., add constraints, change type, generate examples).
    *   **Generate Sample Data**: Get realistic JSON data based on your schema and a custom prompt.
*   **Form Preview**: Instantly visualize how your defined schema translates into a user-friendly form.
*   **Code Export**: Generate ready-to-use code snippets for:
    *   **cURL Commands**: Test your schema with various LLM APIs (OpenAI, Gemini, Mistral, OpenRouter).
    *   **Python (Pydantic)**: Define your data models in Python.
    *   **JavaScript (Zod)**: Define your data validation schemas in TypeScript/JavaScript.
*   **Save & Load**: Persist your schemas locally in the browser's storage for easy access and management.
*   **Import/Export JSON**: Import existing JSON schemas or export your generated schema as a JSON file.
*   **Responsive Design**: A clean and responsive UI built with Tailwind CSS and shadcn/ui.
*   **Dark Mode**: Toggle between light and dark themes for comfortable viewing.

## 🛠️ Technologies Used

*   **Dyad**: An AI editor for building and modifying web applications.
*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui**: Reusable components built with Radix UI and Tailwind CSS.
*   **Dnd Kit**: A lightweight, performant, accessible, and modular drag & drop toolkit for React.
*   **React Router**: For declarative routing in your React application.
*   **Zod**: TypeScript-first schema declaration and validation library (used in generated JS code).
*   **Pydantic**: Data validation and settings management using Python type hints (used in generated Python code).
*   **OpenAI API**: For AI-powered schema generation, refinement, and data generation.
*   **Google Gemini API**: Alternative LLM provider for AI features.
*   **Mistral AI API**: Another alternative LLM provider.
*   **OpenRouter API**: Unified API for various LLMs.
*   **Vite**: A fast frontend build tool.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Make sure you have Node.js (LTS version recommended) and npm (or yarn) installed.

*   [Node.js](https://nodejs.org/)
*   [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
    (Replace `your-username/your-repo-name` with your actual repository details)

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:8080` (or another port if 8080 is in use).

### API Keys for AI Features

To use the AI generation, refinement, and data generation features, you will need an API key from one of the supported LLM providers (OpenAI, Google Gemini, Mistral AI, OpenRouter).

*   **OpenAI**: [platform.openai.com](https://platform.openai.com/)
*   **Google Gemini**: [aistudio.google.com](https://aistudio.google.com/)
*   **Mistral AI**: [console.mistral.ai](https://console.mistral.ai/)
*   **OpenRouter**: [openrouter.ai](https://openrouter.ai/)

Your API key is stored locally in your browser for convenience and is never sent to any server.

## 💡 Usage

1.  **Add Fields**: Click "Add New Field" to start defining your schema.
2.  **Configure Fields**: Use the dropdowns and toggles to set field names, types, whether they are arrays, and if they are required.
3.  **Advanced Options**: Expand the "Advanced options" section for each field to add titles, descriptions, examples, and min/max constraints.
4.  **Reusable Types**: Go to "Manage Reusable Types" to define complex object structures that can be referenced by other fields.
5.  **AI Generation**: Use the "Generate with AI" button to create a schema from a prompt, or the "Refine Field" button on individual fields to modify them with AI.
6.  **Preview & Export**: Use the "Export" button to view the generated JSON Schema, see a live form preview, generate sample data, or get code snippets (cURL, Python, JavaScript).
7.  **Save/Load**: Use the "Save Schema" and "Load Schema" buttons to manage your schemas in local storage.

## 📸 Screenshots

![Screenshot 1](assets/screenshot1.png)
![Screenshot 2](assets/screenshot2.png)

## 🌐 Deployment

This project is configured for automatic deployment to GitHub Pages using a GitHub Actions workflow. Any push to the `main` branch will trigger a build and deploy the static site to the `gh-pages` branch.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## ✉️ Contact

Developed by [Amir Alizadeh](https://x.com/amirdev1997).

---
Enjoy building your schemas!