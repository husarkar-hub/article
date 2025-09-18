"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Import the CreateArticleForm component from the parent page
import { CreateArticleForm } from "../page";

const CreateArticlePage = () => {
  const router = useRouter();

  return (
    <div className="p-6">
      <CreateArticleForm />
    </div>
  );
};

export default CreateArticlePage;
