/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+draft_js
 */

'use strict';

import type {DraftInlineStyle} from 'DraftInlineStyle';
import type {EntityLayer} from '../encoding/EntityLayer';

const {Map, OrderedSet, Record} = require('immutable');

// Immutable.map is typed such that the value for every key in the map
// must be the same type
type CharacterMetadataConfigValueType = DraftInlineStyle | ?string;
type CharacterMetadataConfigRawValueType = Array<string> | ?string;

export type CharacterMetadataRawConfig = {
  style?: CharacterMetadataConfigRawValueType,
  entity?: CharacterMetadataConfigRawValueType,
  entity2nd?: CharacterMetadataConfigRawValueType,
  ...
};

type CharacterMetadataConfig = {
  style?: CharacterMetadataConfigValueType,
  entity?: CharacterMetadataConfigValueType,
  entity2nd?: CharacterMetadataConfigValueType,
};

const EMPTY_SET = OrderedSet();

const defaultRecord: CharacterMetadataConfig = {
  style: EMPTY_SET,
  entity: null,
  entity2nd: null,
};

const CharacterMetadataRecord = (Record(defaultRecord): any);

class CharacterMetadata extends CharacterMetadataRecord {
  getStyle(): DraftInlineStyle {
    return this.get('style');
  }

  getEntity(layer: EntityLayer): ?string {
    if (layer) {
      return this.get('entity2nd');
    }

    return this.get('entity');
  }

  hasStyle(style: string): boolean {
    return this.getStyle().includes(style);
  }

  static applyStyle(
    record: CharacterMetadata,
    style: string,
  ): CharacterMetadata {
    const withStyle = record.set('style', record.getStyle().add(style));
    return CharacterMetadata.create(withStyle);
  }

  static removeStyle(
    record: CharacterMetadata,
    style: string,
  ): CharacterMetadata {
    const withoutStyle = record.set('style', record.getStyle().remove(style));
    return CharacterMetadata.create(withoutStyle);
  }

  static applyEntity(
    record: CharacterMetadata,
    entityKey: ?string,
    layer: EntityLayer,
  ): CharacterMetadata {
    const withEntity =
      record.getEntity(layer) === entityKey
        ? record
        : record.set(layer ? 'entity2nd' : ' entity', entityKey);

    return CharacterMetadata.create(withEntity);
  }

  /**
   * Use this function instead of the `CharacterMetadata` constructor.
   * Since most content generally uses only a very small number of
   * style/entity permutations, we can reuse these objects as often as
   * possible.
   */
  static create(config?: CharacterMetadataConfig): CharacterMetadata {
    if (!config) {
      return EMPTY;
    }

    const defaultConfig: CharacterMetadataConfig = {
      style: EMPTY_SET,
      entity: (null: ?string),
      entity2nd: (null: ?string),
    };

    // Fill in unspecified properties, if necessary.
    const configMap = Map(defaultConfig).merge(config);

    const existing: ?CharacterMetadata = pool.get(configMap);
    if (existing) {
      return existing;
    }

    const newCharacter = new CharacterMetadata(configMap);
    pool = pool.set(configMap, newCharacter);
    return newCharacter;
  }

  static fromJS({
    style,
    entity,
    entity2nd,
  }: CharacterMetadataRawConfig): CharacterMetadata {
    return new CharacterMetadata({
      style: Array.isArray(style) ? OrderedSet(style) : style,
      entity: Array.isArray(entity) ? OrderedSet(entity) : entity,
      entity2nd: Array.isArray(entity2nd) ? OrderedSet(entity2nd) : entity2nd,
    });
  }
}

const EMPTY = new CharacterMetadata();
let pool: Map<Map<any, any>, CharacterMetadata> = Map([
  [Map(defaultRecord), EMPTY],
]);

CharacterMetadata.EMPTY = EMPTY;

module.exports = CharacterMetadata;
