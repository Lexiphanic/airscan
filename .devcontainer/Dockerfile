ARG VARIANT
FROM mcr.microsoft.com/vscode/devcontainers/cpp:0-${VARIANT}


ARG ARDUINO_IDE_VERSION
ARG ARDUINO_CLI_VERSION
ARG USER_NAME
# Dialout GID standart olarak 20'dir, bunu varsayılan yapıyoruz.
ARG DIALOUT_GID=20
# Autoflash patch for BW16 (default: enabled)
ARG ENABLE_AUTOFLASH=true


RUN apt update \
    && apt install -y \
    python3 \
    python3-pip \
    usbutils \
    python3-serial \
    git \
    bash-completion \
    wget \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Kullanıcıya şifresiz sudo yetkisi ver
RUN echo $USER_NAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USER_NAME \
    && chmod 0440 /etc/sudoers.d/$USER_NAME

# Kullanıcı izinleri ve grup ayarları
# Dialout grubuna eklemek seri port erişimi için kritiktir
RUN if [ $(getent group dialout) ]; then \
        usermod -a -G dialout $USER_NAME; \
    fi \
    && if grep :${DIALOUT_GID}: /etc/group; then \
        usermod -a -G $(grep :${DIALOUT_GID}: /etc/group | cut -d ':' -f 1) $USER_NAME; \
    else \
        groupadd -g ${DIALOUT_GID} vscodedialout && usermod -a -G vscodedialout $USER_NAME; \
    fi

# Install Arduino CLI
RUN mkdir -p /opt/arduino-cli \
    && cd /opt/arduino-cli \
    && wget https://github.com/arduino/arduino-cli/releases/download/v${ARDUINO_CLI_VERSION}/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz \
    && tar -xf arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz \
    && rm -f arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz \
    && mv arduino-cli /usr/local/bin/arduino-cli

# Set the default user
USER $USER_NAME

LABEL arduino-ide-version="${ARDUINO_IDE_VERSION}"
LABEL description="Image based on Debuan providing Arduino and Bun"

# Project specific section
# ========================

# Install `arduino-cli` and specific setup for the BW16 
RUN arduino-cli config init \
    && arduino-cli config add board_manager.additional_urls https://github.com/ambiot/ambd_arduino/raw/master/Arduino_package/package_realtek_amebad_index.json \
    && arduino-cli core update-index \
    && arduino-cli core install realtek:AmebaD

# Apply autoflash patch for BW16 if enabled
RUN if [ "$ENABLE_AUTOFLASH" = "true" ]; then \
    echo "Applying autoflash patch for BW16..." && \
    # Back up the original first \
    cp ~/.arduino15/packages/realtek/tools/ameba_d_tools/1.1.3/upload_image_tool_linux \
       ~/.arduino15/packages/realtek/tools/ameba_d_tools/1.1.3/upload_image_tool_linux.bak && \
    # Download the patched v2.2 binary (Linux) \
    wget -O ~/.arduino15/packages/realtek/tools/ameba_d_tools/1.1.3/upload_image_tool_linux \
      https://github.com/jojoling/ameba_bw16_autoflash/raw/refs/heads/main/ameba_d_tools_linux/upload_image_tool_linux && \
    # Make it executable \
    chmod +x ~/.arduino15/packages/realtek/tools/ameba_d_tools/1.1.3/upload_image_tool_linux && \
    echo "Autoflash patch applied successfully"; \
else \
    echo "Autoflash patch disabled (ENABLE_AUTOFLASH=false)"; \
fi

# Install Bun
RUN curl -fsSL https://bun.com/install | bash