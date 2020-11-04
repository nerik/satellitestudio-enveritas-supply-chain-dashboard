# Build paths overriden by main Make system:
BUILD_CACHE:=./build-cache
INSTALL_PREFIX:=$(BUILD_CACHE)/output

# Production install will be at:
# https://products.enveritas.org/supply-chain-central-america-2017/
INSTALL_SUBDIR_PATH=products/supply-chain/central-america-2017

NPM_INSTALL_COMMAND:=npm install

# Use 'make build' to compile code:
.PHONY: build
build: $(BUILD_CACHE)/build
	@#

# Use 'make run' to directly run the dashboard in npm, dev mode:
run:
	npm run dev

# Use 'make clean' to reset build:
clean:
	rm -rf build node_modules build-cache

# Use 'make test' for any post-build, pre-install checks you want:
test:
	@#

# 'make install' is used by the main Make system to place the project
# into the final directory structure:
install:
	mkdir -p "$(INSTALL_PREFIX)/$(INSTALL_SUBDIR_PATH)"
	rsync -a $(BUILD_CACHE)/build/ "$(INSTALL_PREFIX)/$(INSTALL_SUBDIR_PATH)/"


####################################
# build dependencies:

$(BUILD_CACHE)/build:
	-rm -rf ./build
	@# -dd: debug mode, so we can see where installs hang in CI setup
	$(NPM_INSTALL_COMMAND)
	npm run build --json-data=./data/exports/dummy-data.json # This is expected to build output into ./dist
	mkdir -p $(BUILD_CACHE)
	mv ./build $(BUILD_CACHE)/build  # We do it this way for automic success reasons
