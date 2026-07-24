# Plant Disease Identifier API

This API is built using Python, FastAPI, TensorFlow, and Keras. It is used to predict the type of disease in a plant based on an image of the plant.

## Installation

1) Navigate to the project directory:
```bash
cd plant-disease-ident-api
```

2) Install the required Python packages using the following command:
```bash
pip install -r requirements.txt
```

## Usage

1) To start the server with the uvicorn command, run the following command in your terminal:

.\venv\Scripts\activate

```python
uvicorn main:app --host=0.0.0.0 --port=8000
```
This command will start the server on http://localhost:8000. You can change the host and port values according to your requirements.

2) Once the server is running, you can test the API using any HTTP client, such as Postman. The API has the following two endpoints:

GET /ping: This endpoint can be used to test whether the server is running or not. It will return a "Helloo!" message if the server is running.

POST /predict: This endpoint is used to predict the type of disease in a plant based on an image of the plant leaf. You need to send a multipart/form-data request to this endpoint with the image file in the file field. The response will contain the predicted disease class, the index of the disease class, and the confidence of the prediction.