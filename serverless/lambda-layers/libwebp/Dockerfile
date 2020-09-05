# prior art
# https://gist.github.com/dustMason/59ace48a844a066bd2167a03734704a5
# https://stackoverflow.com/questions/53863210/what-flags-do-i-need-to-set-to-be-able-to-statically-link-libwebp-1-0-0-with-pro
# https://github.com/serverlesspub/imagemagick-aws-lambda-2/blob/master/Makefile_ImageMagick

FROM lambci/lambda:build-nodejs12.x as build-stage

ARG CACHE_DIR=/var/task/build-cache
ARG PKG_CONFIG_PATH="PKG_CONFIG_PATH=${CACHE_DIR}/lib/pkgconfig"
ARG LDFLAGS="LDFLAGS=-L${CACHE_DIR}/lib"
ARG CPPFLAGS="CPPFLAGS=-I${CACHE_DIR}/include"
ARG PREFIX="--prefix=${CACHE_DIR}"
ARG CONFIGURE="./configure \
		--disable-dependency-tracking \
		--disable-shared \
		--enable-static \
        --enable-delegate-build \
        --disable-docs \
        "

# RUN yum update -y
# RUN yum -y install libjpeg-turbo-devel libpng-devel libtiff-devel giflib-devel freeglut-devel SDL-devel


# libjpeg
ARG JPEG_VERSION=9d
WORKDIR /var/task
RUN curl -L --remote-name http://www.ijg.org/files/jpegsrc.v${JPEG_VERSION}.tar.gz
RUN tar xf jpegsrc.v${JPEG_VERSION}.tar.gz
WORKDIR /var/task/jpeg-${JPEG_VERSION}
RUN eval "${PKG_CONFIG_PATH} ${LDFLAGS} ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
RUN make
RUN make install


# giflib
ARG GIF_VERSION=5.1.4
WORKDIR /var/task
RUN curl -L --remote-name http://downloads.sourceforge.net/giflib/giflib-${GIF_VERSION}.tar.gz
RUN tar xf giflib-${GIF_VERSION}.tar.gz
WORKDIR /var/task/giflib-${GIF_VERSION}
RUN eval "${PKG_CONFIG_PATH} ${LDFLAGS} ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
RUN make
RUN make install


# libpng
ARG PNG_VERSION=1.6.37
WORKDIR /var/task
RUN curl -L --remote-name http://prdownloads.sourceforge.net/libpng/libpng-${PNG_VERSION}.tar.gz
RUN tar xf libpng-${PNG_VERSION}.tar.gz
WORKDIR /var/task/libpng-${PNG_VERSION}
RUN eval "${PKG_CONFIG_PATH} ${LDFLAGS} ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
RUN make
RUN make install


# tiff
ARG TIFF_VERSION=4.0.9
WORKDIR /var/task
RUN curl -L --remote-name http://download.osgeo.org/libtiff/tiff-${TIFF_VERSION}.tar.gz
RUN tar xf tiff-${TIFF_VERSION}.tar.gz
WORKDIR /var/task/tiff-${TIFF_VERSION}
RUN eval "${PKG_CONFIG_PATH} ${LDFLAGS} ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
RUN make
RUN make install


# SDL - gave up
# WORKDIR /var/task
# RUN curl -L --remote-name https://www.libsdl.org/release/SDL2-2.0.12.tar.gz
# RUN tar xf SDL2-2.0.12.tar.gz
# WORKDIR /var/task/SDL2-2.0.12
# RUN ./autogen.sh
# RUN eval "${PKG_CONFIG_PATH} ${LDFLAGS} ${CPPFLAGS} ${CONFIGURE} ${PREFIX}"
# RUN make
# RUN make install


# libfreetype - not using
# WORKDIR /var/task
# RUN curl -L --remote-name http://download.savannah.gnu.org/releases/freetype/freetype-2.10.1.tar.gz
# RUN tar xf freetype-2.10.1.tar.gz
# WORKDIR /var/task/freetype-2.10.1
# RUN eval ${CONFIGURE}
# RUN make
# RUN make install


# libjpeg-turbo - not using
# ARG JPEG_TURBO_VERSION=2.0.5
# RUN curl -L -o libjpeg-turbo-${JPEG_TURBO_VERSION}.tar.gz https://github.com/libjpeg-turbo/libjpeg-turbo/archive/${JPEG_TURBO_VERSION}.tar.gz
# RUN tar xvzf libjpeg-turbo-${JPEG_TURBO_VERSION}.tar.gz
# WORKDIR /var/task/libjpeg-turbo-${JPEG_TURBO_VERSION}
# RUN cmake -DCMAKE_INSTALL_PREFIX=/usr \
      # -DCMAKE_BUILD_TYPE=RELEASE  \
      # -DENABLE_STATIC=TRUE       \
      # -DCMAKE_INSTALL_DEFAULT_LIBDIR=lib
# RUN make
# RUN make install


# libwebp
ARG CWEBP_VERSION=1.1.0
ENV PATH="${CACHE_DIR}/bin:${PATH}"
WORKDIR /var/task
RUN curl -L --remote-name https://github.com/webmproject/libwebp/archive/v${CWEBP_VERSION}.tar.gz
RUN tar xf v${CWEBP_VERSION}.tar.gz
WORKDIR /var/task/libwebp-${CWEBP_VERSION}
RUN ./autogen.sh
RUN eval "${PKG_CONFIG_PATH} \
    LIBPNG_CONFIG=\"${CACHE_DIR}/bin/libpng-config --static\" \
    ${LDFLAGS} \
    ${CPPFLAGS} \
    ${CONFIGURE} --enable-libwebpmux \
            --enable-libwebpdemux  \
            --enable-libwebpdecoder \
            --enable-libwebpextras  \
            --enable-swap-16bit-csp \
            --prefix=/opt/libwebp-${CWEBP_VERSION} \
    > ${CACHE_DIR}/out.txt"
RUN make
RUN make install
RUN printf "%b\n" "*\n!.gitignore" >> /opt/libwebp-${CWEBP_VERSION}/.gitignore

# using `build -o` only exports from last stage
FROM scratch AS export-stage
ARG CWEBP_VERSION=1.1.0
COPY --from=build-stage /var/task/build-cache build-cache
COPY --from=build-stage /opt/libwebp-${CWEBP_VERSION} libwebp-${CWEBP_VERSION}
