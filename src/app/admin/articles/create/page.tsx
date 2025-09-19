"use client";

import React from "react";

// Import the CreateArticleForm component from the parent page
import { CreateArticleForm } from "../page";

const CreateArticlePage = () => {
  return (
    <div className="p-6">
      <CreateArticleForm />
    </div>
  );
};

export default CreateArticlePage;
