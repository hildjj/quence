ARROW = ../bin/arrow
SRCS = $(wildcard *.wsd)
PICS = ${SRCS:.wsd=.png}

.SUFFIXES:
.SUFFIXES: .wsd .png .pdf
.PRECIOUS: %.pdf

all: $(PICS)

clean:
	-$(RM) *.pdf *.png

.wsd.pdf :
	$(ARROW) -o pdf $< -n

.pdf.png :
	convert -density 150 $< -flatten -trim -transparent "#ffffff"  $@
