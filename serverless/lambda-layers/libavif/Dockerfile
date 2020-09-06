FROM lambci/lambda:build-nodejs12.x as build-stage

ARG CACHE_DIR=/var/task/build-cache
ARG PKG_CONFIG_PATH="PKG_CONFIG_PATH=${CACHE_DIR}/lib/pkgconfig"
# ARG LDFLAGS="LDFLAGS=-L${CACHE_DIR}/lib"
ARG CPPFLAGS="CPPFLAGS=-I${CACHE_DIR}/include"
ARG PREFIX="--prefix=${CACHE_DIR}"
ARG CONFIGURE="./configure \
		--disable-dependency-tracking \
		--disable-shared \
		--enable-static \
        --enable-delegate-build \
        --disable-docs \
        "

RUN yum update -y
RUN yum -y install cmake3 ninja-build nasm 

# libjpeg
ARG JPEG_VERSION=9d
WORKDIR /var/task
RUN curl -L --remote-name http://www.ijg.org/files/jpegsrc.v${JPEG_VERSION}.tar.gz
RUN tar xf jpegsrc.v${JPEG_VERSION}.tar.gz
WORKDIR /var/task/jpeg-${JPEG_VERSION}
RUN eval "${PKG_CONFIG_PATH} LDFLAGS=-L${CACHE_DIR}/lib ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
RUN make
RUN make install

# libpng
ARG PNG_VERSION=1.6.37
WORKDIR /var/task
RUN curl -L --remote-name http://prdownloads.sourceforge.net/libpng/libpng-${PNG_VERSION}.tar.gz
RUN tar xf libpng-${PNG_VERSION}.tar.gz
WORKDIR /var/task/libpng-${PNG_VERSION}
RUN eval "${PKG_CONFIG_PATH} LDFLAGS=-L${CACHE_DIR}/lib ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
RUN make
RUN make install

# https://www.reddit.com/r/AV1/comments/hdshcc/how_to_compile_avifenc_avifdec_and_avifdump_tools/
WORKDIR /var/task
RUN git clone --depth 1 --branch v0.8.1 https://github.com/AOMediaCodec/libavif.git
WORKDIR /var/task/libavif
RUN mkdir build
WORKDIR /var/task/libavif/ext
RUN sed -i 's/cmake/cmake3/;s/ninja/ninja-build/' aom.cmd
RUN ./aom.cmd
WORKDIR /var/task/libavif/build
RUN cmake3 -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DAVIF_CODEC_AOM=ON \
    -DAVIF_LOCAL_AOM=ON \
    -DAVIF_BUILD_APPS=ON \
    -DAVIF_LOCAL_ZLIBPNG=OFF \
    -DAVIF_LOCAL_JPEG=OFF \
    -DJPEG_INCLUDE_DIR=/var/task/build-cache/include \
    -DPNG_PNG_INCLUDE_DIR=/var/task/build-cache/include \
    -DPNG_LIBRARY=/var/task/build-cache/lib/libjpeg.a \
    -DJPEG_LIBRARY=/var/task/build-cache/lib/libpng16.a \
    ..
RUN ninja-build

RUN printf "%b\n" "*\n!.gitignore" >> /var/task/libavif/build/.gitignore

# using `build -o` only exports from last stage
FROM scratch AS export-stage
COPY --from=build-stage /var/task/libavif/build/avifenc libavif-0.8.1/avifenc
COPY --from=build-stage /var/task/libavif/build/avifenc libavif-0.8.1/avifdec
COPY --from=build-stage /var/task/libavif/build/.gitignore libavif-0.8.1/.gitignore
