#include <stdio.h>
#include <unistd.h>
#include "pi_2_dht_read.h"

int main() {
  float humidity, temperature;
  int success;
  FILE *fptr;

  while (1) {
  do {
    success = pi_2_dht_read(11, 4, &humidity, &temperature);
  } while (success != 0);

  fptr = fopen("temperature","w");
  fprintf(fptr,"%1.1f", temperature);
  fclose(fptr);

  sleep(2);
  }
  return 0;
}
