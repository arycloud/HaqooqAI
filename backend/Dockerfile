FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the entire project directory into the container
COPY . /app

# Install dependencies from requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -r src/requirements.txt

# Create a non-root user
RUN adduser --disabled-password --gecos "" appuser
# Create the data directory and change its ownership to the new user
RUN mkdir -p /app/data && chown -R appuser:appuser /app/data
# Switch to the new user
USER appuser

# Expose the application port
EXPOSE 7860

# Run the uvicorn server, referencing the app within the src package
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "7860"]

