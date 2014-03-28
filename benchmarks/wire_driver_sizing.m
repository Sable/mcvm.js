% WIRE_DRIVER_SIZING    Combined sizing of drivers, repeaters, and wire
%                       (figures are generated)
% Section 5.2,  L. Vandenberghe, S. Boyd, and A. El Gamal  "Optimizing 
%                                   dominant time constant in RC circuits"
% Original by Lieven Vandenberghe 
% Adapted for CVX by Joelle Skaf - 11/25/05
%
% The first driver drives an interconnect wire, modeled as n RC Pi segments
% connected to a repeater, which drives a capacitive load through another n
% segment wires. The problem is to determine the sizes of the wire segments
% (x1, . . . , x40) and the sizes of the driver & repeater d1 and d2.
% We want to minimize area subject to bound on the combined delay Tdom1 + 
% Tdom2 of the two stages.
%               minimize        L(d1 + d2) + sum(xi*li)
%                   s.t.        0 <= xi <= wmax
%                               d1 >=0 , d2 >= 0
%                               (Tmax/2)G1(x, d1, d2) - C1(x,d2) >= 0
%                               (Tmax/2)G2(x, d1, d2) - C2(x) >= 0


function [GG1, GG2] = wire_driver_sizing(n)

% circuit parameters
% n = 21;        % number of nodes per wire 
m = n-1;       % number of segments per wire
g = 1.0;       % output conductance is g times driver size 
c0 = 1.0;      % input capacitance of driver is co + c*driver size 
c = 3.0; 
alpha = 10;    % wire segment: two capacitances beta*width
beta = 0.5;    % wire segment: conductance alpha*width
C = 50;        % external load
L = 10.0;      % area is sum xi + L*(d1+d2)
wmax = 2.0;    % maximum wire width
dmax = 100.0;  % maximum driver size 

% capacitance matrix of first circuit: 
CC1 = zeros(n*n,2*m+3);

%  external load from second driver
CC1(n*n,1) = c0;
CC1(n*n,2*m+3) = c;

% capacitances from segments
for i=1:(n-1);
    CC1((i-1)*n+i,i+1) = CC1((i-1)*n+i,i+1) + beta;
    CC1(i*n+i+1,i+1) = CC1(i*n+i+1,i+1) + beta;
end;

% conductance matrix of first circuit
GG1 = zeros(n*n,2*m+3);

% (1,1) element of GG1_0 is g*d1
GG1(1,2*m+2) = g;

% conductances from segments
for i=1:(n-1)         
    GG1((i-1)*n+i,i+1) = GG1((i-1)*n+i,i+1) + alpha;
    GG1((i-1)*n+i+1,i+1) = GG1((i-1)*n+i+1,i+1) - alpha;
    GG1(i*n+i,i+1) = GG1(i*n+i,i+1) - alpha;
    GG1(i*n+i+1,i+1) = GG1(i*n+i+1,i+1) + alpha;
end;

% capacitance matrix of second circuit 
CC2 = zeros(n*n,2*m+3);

% external load
CC2(n*n,1) = C;

% capacitances from segments
for i=1:(n-1);
    CC2((i-1)*n+i,m+i+1) = CC2((i-1)*n+i,m+i+1)  + beta;
    CC2(i*n+i+1,m+i+1) = CC2(i*n+i+1,m+i+1)  + beta;
end;


% conductance matrix of second circuit
GG2 = zeros(n*n, 2*m+3);

% conductance of second driver
GG2(1,2*m+3) = g;

% conductances of segments
for i=1:(n-1);         
    GG2((i-1)*n+i,m+i+1) = GG2((i-1)*n+i,m+i+1) + alpha;
    GG2((i-1)*n+i+1,m+i+1) = GG2((i-1)*n+i+1,m+i+1) - alpha;
    GG2(i*n+i,m+i+1) = GG2(i*n+i,m+i+1) - alpha;
    GG2(i*n+i+1,m+i+1) = GG2(i*n+i+1,m+i+1) + alpha;
end;

end

