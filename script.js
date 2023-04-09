const API_KEY = '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';
const API_BASE_URL = "https://api.openai.com/v1/completions";

async function fetchGeneratedDishes(ingredients, cuisine, difficulty) {
  const descriptionPrompt = createDescription(ingredients, cuisine, difficulty);

  try {
    const dishes = await Promise.all([
      submitDescription(descriptionPrompt, 0.2),
      submitDescription(descriptionPrompt, 0.4),
      submitDescription(descriptionPrompt, 0.6),
    ]);

    const images = await Promise.all([
      generateImage(dishes[0]),
      generateImage(dishes[1]),
      generateImage(dishes[2]),
    ]);

    return images.map((imgUrl, index) => ({
      url: imgUrl,
      description: dishes[index],
    }));
  } catch (error) {
    console.error('Error fetching generated dishes:', error);
    return [];
  }
}


function createDescription(ingredients, cuisine, difficulty) {
  if (difficulty === "Simple and easy home cooking") {
    return `In front of you is a simple and tasty home-cooked ${cuisine} dish that incorporates ${ingredients}.
          Describe exactly what this dish looks like.`;
  } else if (difficulty === "Impressive restaurant quality") {
    return `In front of you is an impressive and perfectly executed ${cuisine} dish that incorporates ${ingredients}.
          Describe exactly what this dish looks like.`;
  } else if (difficulty === "Extremely fancy fine-dining") {
    return `In front of you is an extremely fancy, fine-dining, 3 Michelin-starred, ${cuisine} dish that incorporates ${ingredients}, plated in a very fancy way.
          Describe exactly what this dish looks like.`;
  } else {
    return `In front of you is a complex and delicious ${cuisine} dish that incorporates ${ingredients}.
          Describe exactly what this dish looks like.`;
  }
}

async function submitDescription(descriptionPrompt, temperature) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        prompt: descriptionPrompt,
        model: "text-davinci-003",
        temperature: temperature,
        max_tokens: 3500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error submitting description:', error);
    throw error;
  }
}

async function generateImage(promptText) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt: promptText,
        n: 1,
        size: '512x512',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );
    return response.data.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

async function generateRecipe(dishPrompt, cuisine) {
  const multilineRecipe = `Write a delicious recipe for the above ${cuisine} dish. Make sure to include all necessary spices. Format the result as follows:

        Name of Dish

        Ingredients \n
        - List \n
        - Of \n
        - Ingredients \n
        
        Procedure \n
        1. Step one \n
        2. Step two \n
        
        Plating \n
        1-2 sentences about how to plate this dish in a very fancy way.
        `;
  const recipePrompt = "This is a description of a dish:\n" + dishPrompt + "\n" + multilineRecipe;
  const data = {
    model: "text-davinci-003",
    prompt: recipePrompt,
    temperature: 0.6,
    max_tokens: 3500,
  };

  const response = await axios.post(API_BASE_URL, data, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  });
  return response.data.choices[0].text;
}

function displayRecipe(recipe) {
  // Get the div element with the ID 'recipe-display'
  const recipeDisplayDiv = document.getElementById('recipe-display');

  // Set the innerHTML of the div to the generated recipe
  recipeDisplayDiv.innerHTML = recipe.replace(/\n/g, '<br>'); // Replace newlines with HTML line breaks
}


document.addEventListener("DOMContentLoaded", () => {

  document.querySelector("form").addEventListener("submit", async (e) => {

    e.preventDefault();

    const ingredients = document.getElementById('ingredients').value;
    const cuisine = document.getElementById('cuisine').value;
    const difficulty = document.getElementById('difficulty').value;

    const images = await fetchGeneratedDishes(ingredients, cuisine, difficulty);

    const recipesDiv = document.getElementById('recipes');
    recipesDiv.innerHTML = '';

    images.forEach((imgData) => {
      const img = document.createElement('img');
      img.src = imgData.url;
      img.alt = 'Generated Recipe';
      img.style.width = '100%';
      img.style.marginBottom = '20px';
      img.setAttribute('data-description', imgData.description);
      recipesDiv.appendChild(img);

      img.addEventListener("click", async () => {
        const description = img.getAttribute("data-description");
        const recipe = await generateRecipe(description, cuisine);
        displayRecipe(recipe);
      });
    });

    document.getElementById('results').style.display = 'block';
  });
});

