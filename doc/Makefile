ARROW = ../bin/quence
SRCS = $(wildcard *.wsd)
PICS = ${SRCS:.wsd=.png}

.SUFFIXES:
.SUFFIXES: .wsd .png .pdf

all: $(PICS)

clean:
	-$(RM) *.pdf *.png 

.wsd.pdf :
	$(ARROW) -o pdf $< -n

.pdf.png :
	gs -q -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r100 -dEPSCrop -sOutputFile=$@ $<
	convert -trim -background transparent -splice 50x0 $@ $@.tmp
	mv $@.tmp $@
