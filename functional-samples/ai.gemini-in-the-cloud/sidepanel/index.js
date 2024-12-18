import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory
} from '../node_modules/@google/generative-ai/dist/index.mjs';

import { Buffer } from '../node_modules/buffer/';

// Important! Do not expose your API in your extension code. You have to
// options:
//
// 1. Let users provide their own API key.
// 2. Manage API keys in your own server and proxy all calls to the Gemini
// API through your own server, where you can implement additional security
// measures such as authentification.
//
// It is only OK to put your API key into this file if you're the only
// user of your extension or for testing.
const apiKey = '...';

let genAI = null;
let model = null;
let generationConfig = {
  temperature: 1
};

const supportedImageTypes = new Set(["png", "jpeg", "webp", "heic", "heif"]);

const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const labelTemperature = document.body.querySelector('#label-temperature');
const imagePreview = document.getElementById('image-preview');
const imageToUpload = document.getElementById('image-to-upload')
const statusDiv = document.getElementById('upload-status');

let imageStr = '';
let imageFormat = '';

function resetImage() {
  imageFormat = '';
  imageStr = '';
  imagePreview.src = '';
}

function initModel(generationConfig) {
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ];
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    safetySettings,
    generationConfig
  });
  return model;
}

async function runPrompt(prompt) {
  try {

    let inputData;
    if (imageStr && imageFormat) {
      inputData = [
        {
          inlineData: {
            data: Buffer.from(imageStr).toString('base64'),
            mimeType: "image/" + imageFormat,
          },
        },
        prompt,
      ]
    }
    else {
      inputData = prompt;
    }

    const result = await model.generateContent(inputData);
    const response = await result.response;
    return response.text();
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}

sliderTemperature.addEventListener('input', (event) => {
  labelTemperature.textContent = event.target.value;
  generationConfig.temperature = event.target.value;
});

inputPrompt.addEventListener('input', () => {
  if (inputPrompt.value.trim()) {
    buttonPrompt.removeAttribute('disabled');
  } else {
    buttonPrompt.setAttribute('disabled', '');
  }
});


imageToUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (!file) {
    statusDiv.textContent = "Please select a file.";
    resetImage();
    return;
  }

  // Check image has a valid format and set the image format to be sent to the Gemini API.
  let validImage = false;
  for (const supportedImageType of supportedImageTypes.values()) {
    if (file.type.startsWith('image/' + supportedImageType)) {
      console.log(supportedImageType);
      validImage = true;
      imageFormat = supportedImageType;
    }
  }
  if (!validImage) {
    statusDiv.textContent = "Please select an image with a valid format. Supported formats are: " + Array.from(supportedImageTypes).join(', ')
    resetImage();
    return;
  }

  // Clear any error message.
  statusDiv.textContent = '';

  // Read image path to show in client-side preview
  const preview_reader = new FileReader();
  preview_reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
  }
  preview_reader.readAsDataURL(file);

  // Read actual image to be sent to the Gemini API.
  const reader = new FileReader();
  reader.onload = (e) => {
    imageStr = e.target.result;
  }
  reader.readAsArrayBuffer(file);
});

buttonPrompt.addEventListener('click', async () => {
  const prompt = inputPrompt.value.trim();
  showLoading();
  try {
    const generationConfig = {
      temperature: sliderTemperature.value
    };
    initModel(generationConfig);
    const response = await runPrompt(prompt, generationConfig);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

function showLoading() {
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  // Make sure to preserve line breaks in the response
  elementResponse.textContent = '';
  const paragraphs = response.split(/\r?\n/);
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    // Don't add a new line after the final paragraph
    if (i < paragraphs.length - 1) {
      elementResponse.appendChild(document.createElement('BR'));
    }
  }
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute('hidden');
}

function hide(element) {
  element.setAttribute('hidden', '');
}
