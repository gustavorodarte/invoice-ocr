FROM public.ecr.aws/lambda/nodejs:20 as build
WORKDIR /build
COPY yarn.lock package.json ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile
COPY . .
# https://esbuild.github.io/api/
# also refer to: https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-lambda-nodejs/lib/bundling.ts
RUN npx esbuild handler.ts migration-runner.ts --bundle --outdir=dist --platform=node --external:aws-sdk --external:@prisma/client

FROM public.ecr.aws/lambda/nodejs:20
WORKDIR ${LAMBDA_TASK_ROOT}

COPY yarn.lock package.json ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile --omit=dev
COPY --from=build /build/dist .
COPY . .