/**
 * @license
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {BrainmapsCredentialsProvider, BrainmapsInstance} from 'neuroglancer/datasource/brainmaps/api';
import {Borrowed} from 'neuroglancer/util/disposable';
import {CancellationToken} from 'neuroglancer/util/cancellation';
import {ChunkManager, WithParameters} from 'neuroglancer/chunk_manager/frontend';
import {DataSource, GetVolumeOptions} from 'neuroglancer/datasource';
import {DataType, VolumeSourceOptions, VolumeType} from 'neuroglancer/sliceview/volume/base';
import {DerivedVolumeChunkSourceParameters} from 'neuroglancer/datasource/derived/base';
import {MultiscaleVolumeChunkSource as GenericMultiscaleVolumeChunkSource, VolumeChunkSource} from 'neuroglancer/sliceview/volume/frontend';
// import {vec3, mat4} from 'gl-matrix';
import { BrainmapsDataSource } from '../brainmaps/frontend';

class DerivedVolumeChunkSource extends
(WithParameters(VolumeChunkSource, DerivedVolumeChunkSourceParameters)) {}

export class DerivedMultiscaleVolumeChunkSource implements GenericMultiscaleVolumeChunkSource {
  numChannels: number;
  dataType: DataType;
  volumeType: VolumeType;
  chunkManager: ChunkManager;

  constructor(public originVolumeChunkSource: GenericMultiscaleVolumeChunkSource, public config: string) {
    this.numChannels = originVolumeChunkSource.numChannels;
    this.dataType = originVolumeChunkSource.dataType;
    this.volumeType = originVolumeChunkSource.volumeType;
    this.chunkManager = originVolumeChunkSource.chunkManager;
  }

  getSources(volumeSourceOptions: VolumeSourceOptions) {
    const originSource = this.originVolumeChunkSource.getSources(volumeSourceOptions)[0][0];
    const derivedSource = this.chunkManager.getChunkSource(
      DerivedVolumeChunkSource, {
        spec: originSource.spec,
        parameters: {
          originSource
        }
      }
    );
    return [[derivedSource]];
  }

  getMeshSource() { return null; }
}


export class DerivedDataSource extends DataSource {
  originDataSource: DataSource;

  constructor(
    instance: BrainmapsInstance, credentialsProvider: Borrowed<BrainmapsCredentialsProvider>) {
      super();
      this.originDataSource = new BrainmapsDataSource(instance, credentialsProvider);
  }

  get description() {
    return 'Derived from ' + this.originDataSource.description;
  }

  getVolume(chunkManager: ChunkManager, config: string, options: GetVolumeOptions, cancellationToken: CancellationToken) {
    return new Promise((resolve) => {
      const dataSource = this.originDataSource;
      resolve(dataSource.getVolume && dataSource.getVolume(chunkManager, config, options, cancellationToken));
    }).then((originVolumeChunkSource: GenericMultiscaleVolumeChunkSource) => {
      return new DerivedMultiscaleVolumeChunkSource(originVolumeChunkSource, config);
    });
  }
}
