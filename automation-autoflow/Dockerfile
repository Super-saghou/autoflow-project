FROM python:3.10-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    sshpass \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install the Python dependencies
COPY requirements.txt /app/
RUN pip install -r requirements.txt

# Copy the application files
COPY . /app

# Expose the port
EXPOSE 5004

# Set the environment variable
ENV ANSIBLE_HOST_KEY_CHECKING=False

# Run the app
CMD ["bash", "-c", "python3 run_playbook.py && tail -f /dev/null"]

