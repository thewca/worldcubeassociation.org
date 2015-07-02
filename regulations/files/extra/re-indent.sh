#!/bin/bash

ALPHA="[A-Za-z]\{1,2\}"
NUMER="[0-9]\{1,2\}"
OPT1="    " # Four spaces for the Regulations, none for the Constitution

cat "$1" | \
  sed "s/^[   ]*\(- ${NUMER}${ALPHA})\)/\1/" | \
  sed "s/^[   ]*\(- ${NUMER}${ALPHA}${NUMER})\)/${OPT1}\1/" | \
  sed "s/^[   ]*\(- ${NUMER}${ALPHA}${NUMER}${ALPHA})\)/${OPT1}${OPT1}\1/" | \
  sed "s/^[   ]*\(- ${NUMER}${ALPHA}${NUMER}${ALPHA}${NUMER})\)/${OPT1}${OPT1}${OPT1}\1/" | \
  sed "s/^[   ]*\(- ${ALPHA}${NUMER})\)/\1/" | \
  sed "s/^[   ]*\(- ${ALPHA}${NUMER}${ALPHA})\)/${OPT1}\1/" | \
  sed "s/^[   ]*\(- ${ALPHA}${NUMER}${ALPHA}${NUMER})\)/${OPT1}${OPT1}\1/" | \
  sed "s/^[   ]*\(- ${ALPHA}${NUMER}${ALPHA}${NUMER}${ALPHA})\)/${OPT1}${OPT1}${OPT1}\1/"