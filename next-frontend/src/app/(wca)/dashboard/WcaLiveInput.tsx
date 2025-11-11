"use client";

import { useIMask } from "react-imask";
import { MaskedEnum } from "imask";
import { DataList, Field, Input } from "@chakra-ui/react";
import _ from "lodash";

export const SKIPPED_VALUE = 0;
export const DNF_VALUE = -1;
export const DNS_VALUE = -2;

function attemptResultToInput(attemptResult: number) {
  console.log("number to string fired", attemptResult);
  if (attemptResult === SKIPPED_VALUE) return '';
  if (attemptResult === DNF_VALUE) return 'DNF';
  if (attemptResult === DNS_VALUE) return 'DNS';
  if (attemptResult === 0) return '';
  const str = `00000000${attemptResult.toString().slice(0, 8)}`;
  const [, hh, mm, ss, cc] = str.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/)!;
  return `${hh}:${mm}:${ss}.${cc}`.replace(/^[0:]*(?!\.)/g, '');
}

function inputToAttemptResult(input: string) {
  console.log("string to number fired", input);
  if (input === '') return SKIPPED_VALUE;
  if (input === 'DNF') return DNF_VALUE;
  if (input === 'DNS') return DNS_VALUE;
  const num = _.toInteger(input.replace(/\D/g, '')) || 0;
  return (
    Math.floor(num / 1000000) * 360000
    + Math.floor((num % 1000000) / 10000) * 6000
    + Math.floor((num % 10000) / 100) * 100
    + (num % 100)
  );
}

export default function WcaLiveInput() {
  const { ref, value, typedValue, unmaskedValue } = useIMask<HTMLInputElement>({
    mask: [
      {
        mask: '[[[00:]00:]00.]00',
        eager: "remove",
      },
      {
        mask: MaskedEnum,
        enum: ["DNF", "DNS"],
        autofix: "pad",
        matchValue(enumString: string, inputString: string) {
          const input = inputString.toLowerCase();
          const option = enumString.toLowerCase();

          if (input === 'd') {
            return option === 'dnf';
          }
          if (input === 's') {
            return option === 'dns';
          }

          return option.startsWith(input);
        },
      },
    ],
    prepare(str, maskRef) {
      if (maskRef.unmaskedValue.length > 0) {
        return str;
      }

      const firstChar = str[0] || '';

      if (firstChar === '/') {
        return 'D';
      }

      if (firstChar === '*') {
        return 'S';
      }

      if (firstChar === 'd') return 'D';
      if (firstChar === 's') return 'S';

      return str;
    },
    dispatch(appended, masked) {
      const firstChar = (masked.unmaskedValue + appended)[0] || '';

      if (/[0-9]/.test(firstChar)) {
        return masked.compiledMasks[0];
      }

      if (/[DS]/.test(firstChar)) {
        return masked.compiledMasks[1];
      }

      return masked.compiledMasks[0];
    },
    format: attemptResultToInput,
    parse: inputToAttemptResult,
  });

  return (
    <Field.Root>
      <Field.Label>WCA Live</Field.Label>
      <Input ref={ref} />
      <Field.HelperText asChild>
        <DataList.Root orientation="horizontal">
          <DataList.Item>
            <DataList.ItemLabel>Value</DataList.ItemLabel>
            <DataList.ItemValue>{value}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Typed Value</DataList.ItemLabel>
            <DataList.ItemValue>{typedValue}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Unmasked Value</DataList.ItemLabel>
            <DataList.ItemValue>{unmaskedValue}</DataList.ItemValue>
          </DataList.Item>
        </DataList.Root>
      </Field.HelperText>
    </Field.Root>
  );
}
